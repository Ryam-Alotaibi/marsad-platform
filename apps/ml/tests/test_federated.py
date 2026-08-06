import numpy as np

from app.federated import fedavg, fit_linear_model, hash_weights, mae_accuracy, predict, split_train_val


def test_fedavg_weighted_average_is_correct():
    client_a = (np.array([2.0, 4.0]), 1.0, 10)  # 10 samples
    client_b = (np.array([6.0, 0.0]), 5.0, 30)  # 30 samples

    weights, bias = fedavg([client_a, client_b])

    # المتوسط المرجّح: (2*10 + 6*30)/40 = 5.0, (4*10+0*30)/40 = 1.0, bias=(1*10+5*30)/40=4.0
    assert np.allclose(weights, [5.0, 1.0])
    assert np.isclose(bias, 4.0)


def test_fedavg_equal_weights_reduces_to_plain_average():
    client_a = (np.array([1.0]), 0.0, 5)
    client_b = (np.array([3.0]), 2.0, 5)

    weights, bias = fedavg([client_a, client_b])

    assert np.allclose(weights, [2.0])
    assert np.isclose(bias, 1.0)


def test_fedavg_single_client_returns_its_own_weights():
    client = (np.array([7.0, -2.0]), 3.5, 12)
    weights, bias = fedavg([client])
    assert np.allclose(weights, [7.0, -2.0])
    assert np.isclose(bias, 3.5)


def test_fedavg_raises_on_empty_input_or_zero_samples():
    try:
        fedavg([(np.array([1.0]), 0.0, 0)])
        assert False, "expected ValueError"
    except ValueError:
        pass


def test_fit_linear_model_recovers_known_linear_relationship():
    rng = np.random.default_rng(42)
    x = rng.uniform(0, 10, size=(200, 2))
    true_weights = np.array([2.0, -1.5])
    true_bias = 3.0
    y = x @ true_weights + true_bias

    weights, bias = fit_linear_model(x, y)

    assert np.allclose(weights, true_weights, atol=1e-6)
    assert np.isclose(bias, true_bias, atol=1e-6)


def test_mae_accuracy_is_100_for_perfect_predictions():
    y = np.array([10.0, 20.0, 30.0])
    assert mae_accuracy(y, y) == 100.0


def test_mae_accuracy_decreases_with_larger_errors():
    y_true = np.array([50.0, 50.0])
    small_error_pred = np.array([51.0, 49.0])
    large_error_pred = np.array([70.0, 30.0])

    assert mae_accuracy(y_true, small_error_pred) > mae_accuracy(y_true, large_error_pred)


def test_hash_weights_is_deterministic_and_sensitive_to_change():
    w = np.array([1.0, 2.0])
    h1 = hash_weights(w, 0.5)
    h2 = hash_weights(w, 0.5)
    h3 = hash_weights(w, 0.6)

    assert h1 == h2
    assert h1 != h3


def test_split_train_val_deterministic_split_sizes():
    features = np.arange(20).reshape(20, 1).astype(float)
    labels = np.arange(20).astype(float)

    train_x, train_y, val_x, val_y = split_train_val(features, labels, val_every=5)

    assert len(val_y) == 4
    assert len(train_y) == 16
    assert set(val_y.tolist()) == {0.0, 5.0, 10.0, 15.0}


def test_predict_matches_manual_computation():
    x = np.array([[1.0, 2.0], [3.0, 4.0]])
    weights = np.array([2.0, 0.5])
    bias = 1.0
    result = predict(x, weights, bias)
    assert np.allclose(result, [1 * 2 + 2 * 0.5 + 1, 3 * 2 + 4 * 0.5 + 1])
