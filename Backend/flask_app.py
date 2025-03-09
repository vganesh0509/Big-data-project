from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from database.mongo_config import db  # Import MongoDB connection
import subprocess  # For running Spark scripts
import jwt

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
app.config["SECRET_KEY"] = "63992f13e7ed15b32438c95f88796b57ddbba7ad997938905a73467b6f77ebb4"

# MongoDB Collections
users_collection = db["users"]
workflows_collection = db["workflows"]

# ✅ User Registration API
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data["username"]
    password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    role = data["role"]  # "instructor" or "student"

    # ✅ Ensure username is unique
    if users_collection.find_one({"username": username}):
        return jsonify({"message": "❌ User already exists!"}), 400

    users_collection.insert_one({"username": username, "password": password, "role": role})
    return jsonify({"message": "✅ User registered successfully!"}), 201

# ✅ User Login API
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = users_collection.find_one({"username": data["username"]})

    if user and bcrypt.check_password_hash(user["password"], data["password"]):
        token = jwt.encode({
			'identity': user["username"],
			'role' : user["role"]
		}, app.config['SECRET_KEY'])

        return jsonify({"token": token.decode('UTF-8'), "role": user["role"]}), 200

    return jsonify({"message": "❌ Invalid credentials!"}), 401

# ✅ Protected Route Example (Check Logged-in User)
@app.route("/api/protected", methods=["GET"])
def protected():
    token = None
    if 'x-access-token' in request.headers:
        token = request.headers['x-access-token']
    if not token:
        return jsonify({'message' : 'Token is missing !!'}), 401
    print( token )
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'])
    except:
        print('INVALID KEY')
    print('ENTER')
    current_user = get_jwt_identity()
    print( current_user )
    return jsonify(logged_in_as=current_user), 200

# ✅ Save a New Workflow (Only Instructors)
@app.route("/api/workflows", methods=["POST"])
@jwt_required()
def save_workflow():
    current_user = get_jwt_identity()
    if current_user["role"] != "instructor":
        return jsonify({"message": "❌ Access Denied! Only Instructors can save workflows."}), 403

    data = request.json  # Get JSON data from request
    workflows_collection.insert_one(data)  # Save to MongoDB
    return jsonify({"message": "✅ Workflow saved successfully!"}), 201

# ✅ Get All Workflows (Accessible by Students & Instructors)
@app.route("/api/workflows", methods=["GET"])
@jwt_required()
def get_workflows():
    try:
        current_user = get_jwt_identity()  # Get user details
        print("✅ Current User:", current_user)  # Debugging: Print user identity

        workflows = list(workflows_collection.find({}, {"_id": 0}))
        print("✅ Workflows Found:", workflows)  # Debugging: Print fetched workflows

        return jsonify(workflows), 200
    except Exception as e:
        print("❌ Error in fetching workflows:", str(e))  # Debugging: Print error
        return jsonify({"message": "Error fetching workflows"}), 500
# ✅ Update a Workflow (Only Instructors)
@app.route("/api/workflows/<workflow_id>", methods=["PUT"])
@jwt_required()
def update_workflow(workflow_id):
    current_user = get_jwt_identity()
    if current_user["role"] != "instructor":
        return jsonify({"message": "❌ Access Denied! Only Instructors can update workflows."}), 403

    data = request.json
    workflows_collection.update_one({"id": workflow_id}, {"$set": data})
    return jsonify({"message": "✅ Workflow updated successfully!"})

# ✅ Delete a Workflow (Only Instructors)
@app.route("/api/workflows/<workflow_id>", methods=["DELETE"])
@jwt_required()
def delete_workflow(workflow_id):
    current_user = get_jwt_identity()
    if current_user["role"] != "instructor":
        return jsonify({"message": "❌ Access Denied! Only Instructors can delete workflows."}), 403

    workflows_collection.delete_one({"id": workflow_id})
    return jsonify({"message": "✅ Workflow deleted successfully!"})

# ✅ Generate PySpark Code from Workflow
@app.route("/api/generate_spark", methods=["POST"])
def generate_spark():
    print('ENTER')
    token = None
    print( request.headers['Authorization'] )
    if 'Authorization' in request.headers:
        print(request.headers )
        token = request.headers['Authorization']
        token = token.split(" ")[1]
    if not token:
        return jsonify({'message' : 'Token is missing !!'}), 401
    print( token )
    try:
        print( 'DECODING' )
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except  Exception as e:
        print('INVALID KEY')
        print( e )
        return jsonify({'message' : 'Invalid Token!!'}), 401

    data = request.json
    print( data )
    nodes = data["nodes"]

    spark_code = """from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("WorkflowExecution").getOrCreate()
"""
    print( 'spark code' )
    for node in nodes:
        spark_code += f"# {node['data']['label']}\n"
        spark_code += "df = spark.read.csv('input.csv', header=True, inferSchema=True)\n"
        spark_code += "df.show()\n\n"
    print( "node" )

    return jsonify({"spark_code": spark_code})

# ✅ Execute Spark Code in a Local Cluster
@app.route("/api/execute_spark", methods=["POST"])
@jwt_required()
def execute_spark():
    data = request.json
    spark_code = data.get("spark_code")

    # Save Spark script to a temporary file
    script_path = "/tmp/workflow_script.py"
    with open(script_path, "w") as file:
        file.write(spark_code)

    try:
        # Execute the script using Spark Submit
        result = subprocess.run(["spark-submit", script_path], capture_output=True, text=True)
        return jsonify({"output": result.stdout, "error": result.stderr})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
