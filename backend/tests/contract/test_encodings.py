def test_get_encodings_shape(client):
    response = client.get("/api/encodings")
    assert response.status_code == 200

    body = response.json()
    assert "encodings" in body
    assert len(body["encodings"]) > 0
    for option in body["encodings"]:
        assert {"name", "is_default", "display_name", "models"}.issubset(set(option.keys()))

    defaults = [o for o in body["encodings"] if o["is_default"]]
    assert len(defaults) == 1
    assert defaults[0]["name"] == "o200k_base"
