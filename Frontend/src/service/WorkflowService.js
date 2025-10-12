import { apiCall, API_CONFIG } from "./api";

export const getWorkflowTemplate = async (requestType) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_WORKFLOW_TEMPLATE, {
      method: "GET",
      params: { type: requestType },
    });
  } catch (error) {
    console.error("getWorkflowTemplate service error:", error);
    throw error;
  }
};


export const getAllWorkflows = async () => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.GET_WORKFLOWS, {
      method: "GET",
    });
  } catch (error) {
    console.error("getAllWorkflows service error:", error);
    throw error;
  }
};


export const createWorkflow = async (workflowData) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.CREATE_WORKFLOW, {
      method: "POST",
      body: JSON.stringify(workflowData),
    });
  } catch (error) {
    console.error("createWorkflow service error:", error);
    throw error;
  }
};


export const updateWorkflow = async (id, workflowData) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.UPDATE_WORKFLOW(id), {
      method: "PUT",
      body: JSON.stringify(workflowData),
    });
  } catch (error) {
    console.error("updateWorkflow service error:", error);
    throw error;
  }
};


export const deleteWorkflow = async (id) => {
  try {
    return await apiCall(API_CONFIG.ENDPOINTS.DELETE_WORKFLOW(id), {
      method: "DELETE",
    });
  } catch (error) {
    console.error("deleteWorkflow service error:", error);
    throw error;
  }
};