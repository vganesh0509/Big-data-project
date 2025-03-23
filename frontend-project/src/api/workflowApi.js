import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api"; // Ensure this matches your backend URL

// ✅ Get the authentication token from local storage
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ✅ Fetch workflows from backend (Accessible by students & instructors)
export const getWorkflows = async () => {
  try {
    const user = JSON.parse( localStorage.getItem('user') );
    const response = await axios.get(`${API_URL}/workflows?userid=${user._id}`, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Workflows fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching workflows:", error.response?.data || error.message);
    return [];
  }
};

// ✅ Save a new workflow to MongoDB (Only for instructors)
export const saveWorkflow = async (workflow) => {
  try {
    const user = JSON.parse( localStorage.getItem('user') );
    const data = {
      workflow,
      userid: user._id
    }
    console.log( data );
    const response = await axios.post(`${API_URL}/workflows`, data, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Workflow saved successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error saving workflow:", error.response?.data || error.message);
    throw error;
  }
};

export const runWorkflow = async (workflow) => {
  try {
    const user = JSON.parse( localStorage.getItem('user') );
    const data = {
      workflow,
      userid: user._id
    }
    console.log( data );
    const response = await axios.post(`${API_URL}/run_workflow`, data, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Workflow saved successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error saving workflow:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Update an existing workflow (Only for instructors)
export const updateWorkflow = async (workflowId, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/workflows/${workflowId}`, updatedData, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Workflow updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating workflow:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Delete a workflow (Only for instructors)
export const deleteWorkflow = async (workflowId) => {
  try {
    const response = await axios.delete(`${API_URL}/workflows/${workflowId}`, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Workflow deleted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting workflow:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Generate PySpark code from workflow nodes
export const generateSparkCode = async (nodes) => {
  try {
    console.log("🔹 Requesting Spark Code Generation:", nodes);
    const response = await axios.post(`${API_URL}/generate_spark`, { nodes }, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Spark code generated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error generating Spark code:", error.response?.data || error.message);
    return { spark_code: "Error generating Spark code" };
  }
};

// ✅ Execute PySpark code in the backend cluster
export const executeSparkCode = async (sparkCode) => {
  try {
    console.log("🔹 Executing Spark Code:", sparkCode);
    const response = await axios.post(`${API_URL}/execute_spark`, { spark_code: sparkCode }, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Spark job executed successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error executing Spark job:", error.response?.data || error.message);
    return { output: "Error executing Spark job" };
  }
};

// ✅ Fetch execution logs for the logged-in user
export const getExecutionLogs = async () => {
  try {
    const response = await axios.get(`${API_URL}/execution_logs`, {
      headers: getAuthHeaders(),
    });
    console.log("✅ Execution logs fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching execution logs:", error.response?.data || error.message);
    return [];
  }
};
