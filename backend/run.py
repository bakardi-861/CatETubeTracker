from app import create_app
from flask import request

app = create_app()

@app.before_request
def log_request():
    # print(f"{request.method} {request.path}")
    pass

if __name__ == "__main__":
    # print("Starting the app")
    app.run(debug=True, port=8000)
