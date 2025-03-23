import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { saveWorkflow, getWorkflows, runWorkflow } from "../api/workflowApi"; // Import API functions
import Modal from "react-modal"; // Import Modal

const initialNodes = [
  { id: "start", type: "input", position: { x: 250, y: 50 }, data: { label: "Start", statements: [] } },
  { id: "end", type: "output", position: { x: 250, y: 400 }, data: { label: "End", statements: [] } },
];

const initialEdges = [];

const WorkflowEditor = ({ userRole }) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflows, setWorkflows] = useState([]); // Stores fetched workflows
  const [selectedWorkflow, setSelectedWorkflow] = useState(""); // Selected workflow name
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [statements, setStatements] = useState([]);
  const [selectedNodeName, setSelectedNodeName] = useState("");
  const [codeModalIsOpen, setCodeModalIsOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(""); // Store generated PySpark code

  // ✅ Fetch workflows from MongoDB on page load
  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const allWorkflows = await getWorkflows();
      console.log("Fetched Workflows:", allWorkflows); // ✅ Debugging fetched data

      // ✅ Filter only workflows created by this user
      const userWorkflows = allWorkflows;
      setWorkflows(userWorkflows);
    } catch (error) {
      console.error("❌ Error fetching workflows:", error);
    }
  };

  // ✅ Handle loading a selected workflow
  const handleLoadWorkflow = (workflowName) => {
    console.log( workflowName );
    if (!workflowName) return;

    const selected = workflows.find((wf) => wf.workflow.name === workflowName);
    if (selected) {
      console.log( selected );
      setNodes(selected.workflow.nodes || []);
      setEdges(selected.workflow.edges || []);
      setSelectedWorkflow(workflowName);
    }
  };

  // ✅ Handle node changes
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // ✅ Handle edge changes
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // ✅ Handle adding new edges
  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  // ✅ Add a new node
  const addNode = () => {
    const newNode = {
      id: uuidv4(),
      position: { x: Math.random() * 600, y: Math.random() * 400 },
      data: { label: `Node ${nodes.length}` },
      type: "default",
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // ✅ Delete selected node
  const deleteNode = () => {
    if (!selectedNode || selectedNode.id === "start" || selectedNode.id === "end") return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNode(null);
    setSelectedNodeName("");
  };

  const openEditModal = () => {
    console.log( selectedNode );
    if (!selectedNode) return;
    setStatements(selectedNode.data.statements || []);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleStatementChange = (index, value) => {
    const newStatements = [...statements];
    newStatements[index] = value;
    setStatements(newStatements);
  };

  const addStatement = () => {
    setStatements([...statements, ""]);
  };

  const deleteStatement = (index) => {
    const newStatements = statements.filter((_, i) => i !== index);
    setStatements(newStatements);
  };


  const saveStatements = () => {
    editNode();
    console.log( statements );
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, statements } } : node
      )
    );
    closeModal();
  };

  // ✅ Edit node label
  const editNode = () => {
    console.log(  selectedNode );
    if (!selectedNode) return;
    const newLabel = selectedNodeName;
    if (newLabel) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id ? { ...node, data: { ...node.data, label: newLabel } } : node
        )
      );
    }
  };

  // ✅ Save workflow to MongoDB with user input name
  const handleSave = async () => {
    const workflowName = prompt("Enter a name for your workflow:");
    if (!workflowName) {
      alert("❌ Workflow name is required!");
      return;
    }

    const workflowData = { name: workflowName, nodes, edges };
    console.log( workflowData );
    try {
      await saveWorkflow(workflowData);
      alert(`✅ Workflow "${workflowName}" saved to MongoDB!`);
      fetchWorkflows(); // Refresh workflow list after saving
    } catch (error) {
      alert("❌ Failed to save workflow.");
      console.error("Error saving workflow:", error);
    }
  };

  
  const handleRun = async () => {
    try{
      const workflowData = { nodes, edges };
      console.log( workflowData );
      
      console.log( workflowData );
      const response = await runWorkflow(workflowData);
      if (response.pyspark_code) {
        alert("✅ Workflow executed! PySpark code generated.");
        setGeneratedCode(response.pyspark_code);  // Store the generated PySpark code
        setCodeModalIsOpen(true);  // Open modal to display code
      } else {
        alert("❌ Failed to generate PySpark code.");
      }
    } catch( error ){
      console.log( error );
      alert('FAIL');
    }
  }

  
    // ✅ Function to copy PySpark code to clipboard
    const copyToClipboard = () => {
      navigator.clipboard.writeText(generatedCode);
      alert("✅ Code copied to clipboard!");
    };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px", background: "#f5f5f5", display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={addNode}>Add Node</button>
        {/* <button onClick={editNode} disabled={!selectedNode}>Edit Node</button> */}
        <button onClick={openEditModal} disabled={!selectedNode  || selectedNode.id === "start" || selectedNode.id === "end"}>Edit Node</button>
        <button onClick={deleteNode} disabled={!selectedNode || selectedNode.id === "start" || selectedNode.id === "end"}>
          Delete Node
        </button>
        <button onClick={handleSave}>Save Workflow</button>

        {/* ✅ Workflow Selection Dropdown */}
        <select onChange={(e) => handleLoadWorkflow(e.target.value)} value={selectedWorkflow} style={{ padding: "5px" }}>
          <option value="">-- Select Workflow --</option>
          {workflows.length > 0 && workflows.map((workflow) => (
            <option key={workflow._id} value={workflow.workflow.name}>
              {workflow.workflow.name}
            </option>
          ))}
        </select>

        <button onClick={handleRun}> Run workflow </button>
      </div>

      <div style={{ flex: 1, border: "1px solid #ddd" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          onNodeClick={(_, node) => {
            setSelectedNode(node);
            setSelectedNodeName(node?.data?.label);
          }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal}>

        <input type="text" value={selectedNodeName} onChange={(e) => setSelectedNodeName(e.target.value)}/>

        <button onClick={editNode}> Save Node Name </button>

        <h2>Edit Node Statements</h2>
        {statements.map((statement, index) => (
        <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            value={statement}
            onChange={(e) => handleStatementChange(index, e.target.value)}
          />
          <button onClick={() => deleteStatement(index)}>Delete</button>
        </div>
      ))}
        <button onClick={addStatement}>+ Add Statement</button>
        <button onClick={saveStatements}>Save</button>
        <button onClick={closeModal}>Cancel</button>
      </Modal>

      <Modal isOpen={codeModalIsOpen} onRequestClose={() => setCodeModalIsOpen(false)}>
        <h2>Generated PySpark Code</h2>
        <pre style={{ background: "#f4f4f4", padding: "10px", overflowX: "auto", whiteSpace: "pre-wrap" }}>
          {generatedCode}
        </pre>
        <button onClick={copyToClipboard}>📋 Copy Code</button>
        <button onClick={() => setCodeModalIsOpen(false)}>Close</button>
      </Modal>;

    </div>
  );
};

export default WorkflowEditor;
