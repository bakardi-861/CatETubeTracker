from flask import Flask, request

app = Flask(__name__)

@app.before_request
def log_req():
    print(f"Request: {request.method} {request.path}")

@app.route('/')
def home():
    print("Home route called")
    return "Hello from test app!"

if __name__ == "__main__":
    app.run(debug=True)
