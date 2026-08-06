"""
منطق مرصاد الاتحادي: تدريب محلي بسيط لكل جهة (انحدار خطي)، وتجميع Federated
Averaging (FedAvg — McMahan et al. 2017): المتوسط المرجّح لأوزان النماذج
المحلية حسب حجم بيانات كل جهة، دون تبادل أي بيانات خام بين الجهات.
"""

import hashlib
import json

import numpy as np


def fit_linear_model(features: np.ndarray, labels: np.ndarray) -> tuple[np.ndarray, float]:
    """يدرّب انحدارًا خطيًا بالمربعات الصغرى (closed-form least squares)."""
    augmented = np.hstack([features, np.ones((features.shape[0], 1))])
    coefficients, *_ = np.linalg.lstsq(augmented, labels, rcond=None)
    weights, bias = coefficients[:-1], float(coefficients[-1])
    return weights, bias


def predict(features: np.ndarray, weights: np.ndarray, bias: float) -> np.ndarray:
    return features @ weights + bias


def mae_accuracy(y_true: np.ndarray, y_pred: np.ndarray, scale: float = 100.0) -> float:
    """يحوّل متوسط الخطأ المطلق (MAE) إلى نسبة دقة تقريبية 0-100%."""
    if len(y_true) == 0:
        return 0.0
    mae = float(np.mean(np.abs(y_true - y_pred)))
    return max(0.0, min(100.0, 100.0 - (mae / scale) * 100.0))


def fedavg(
    client_updates: list[tuple[np.ndarray, float, int]],
) -> tuple[np.ndarray, float]:
    """Federated Averaging: متوسط أوزان النماذج المحلية مرجّحًا بحجم بيانات كل عميل."""
    total_samples = sum(n for _, _, n in client_updates)
    if total_samples == 0:
        raise ValueError("لا توجد بيانات كافية للتجميع")

    weight_dim = client_updates[0][0].shape[0]
    global_weights = np.zeros(weight_dim)
    global_bias = 0.0

    for weights, bias, n in client_updates:
        share = n / total_samples
        global_weights += weights * share
        global_bias += bias * share

    return global_weights, global_bias


def hash_weights(weights: np.ndarray, bias: float) -> str:
    payload = json.dumps({"weights": weights.tolist(), "bias": bias}, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def split_train_val(
    features: np.ndarray, labels: np.ndarray, val_every: int = 5
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """تقسيم حتمي (وليس عشوائيًا) للتكرار: كل خامس عيّنة للتحقق، والباقي للتدريب."""
    indices = np.arange(len(labels))
    val_mask = indices % val_every == 0
    if val_mask.sum() == 0 or (~val_mask).sum() == 0:
        return features, labels, features, labels
    return features[~val_mask], labels[~val_mask], features[val_mask], labels[val_mask]
