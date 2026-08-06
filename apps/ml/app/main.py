import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel

from app.federated import fedavg, fit_linear_model, hash_weights, mae_accuracy, predict, split_train_val

app = FastAPI(
    title="Marsad ML Service",
    description="Federated learning aggregation service (مرصاد الاتحادي) and scenario simulation (phase 6).",
    version="0.2.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "marsad-ml"}


class Sample(BaseModel):
    features: list[float]
    label: float


class TenantData(BaseModel):
    tenant_id: str
    samples: list[Sample]


class TrainRequest(BaseModel):
    tenants: list[TenantData]


class TenantResult(BaseModel):
    tenant_id: str
    sample_count: int
    local_accuracy_before: float
    local_accuracy_after: float
    weights_hash: str


class TrainResponse(BaseModel):
    global_weights: list[float]
    global_bias: float
    aggregate_accuracy: float
    tenants: list[TenantResult]


@app.post("/federated/train-and-aggregate", response_model=TrainResponse)
def train_and_aggregate(request: TrainRequest) -> TrainResponse:
    client_updates: list[tuple[np.ndarray, float, int]] = []
    per_tenant_val: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    per_tenant_before: dict[str, float] = {}
    per_tenant_hash: dict[str, str] = {}

    for tenant in request.tenants:
        features = np.array([s.features for s in tenant.samples])
        labels = np.array([s.label for s in tenant.samples])

        train_x, train_y, val_x, val_y = split_train_val(features, labels)

        local_weights, local_bias = fit_linear_model(train_x, train_y)
        local_pred = predict(val_x, local_weights, local_bias)

        per_tenant_before[tenant.tenant_id] = mae_accuracy(val_y, local_pred)
        per_tenant_val[tenant.tenant_id] = (val_x, val_y)
        per_tenant_hash[tenant.tenant_id] = hash_weights(local_weights, local_bias)

        client_updates.append((local_weights, local_bias, len(train_y)))

    global_weights, global_bias = fedavg(client_updates)

    tenant_results: list[TenantResult] = []
    for tenant in request.tenants:
        val_x, val_y = per_tenant_val[tenant.tenant_id]
        global_pred = predict(val_x, global_weights, global_bias)
        after = mae_accuracy(val_y, global_pred)

        tenant_results.append(
            TenantResult(
                tenant_id=tenant.tenant_id,
                sample_count=len(tenant.samples),
                local_accuracy_before=round(per_tenant_before[tenant.tenant_id], 1),
                local_accuracy_after=round(after, 1),
                weights_hash=per_tenant_hash[tenant.tenant_id],
            )
        )

    aggregate_accuracy = round(
        sum(t.local_accuracy_after for t in tenant_results) / len(tenant_results), 1
    )

    return TrainResponse(
        global_weights=global_weights.tolist(),
        global_bias=global_bias,
        aggregate_accuracy=aggregate_accuracy,
        tenants=tenant_results,
    )
