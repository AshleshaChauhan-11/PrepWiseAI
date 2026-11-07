import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getDocuments = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.DOCUMENTS.GET_DOCUMENTS);
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch documents' };
  }
};

const uploadDocument = async (formData) => {
  try {
    const response = await axiosInstance.post(API_PATHS.DOCUMENTS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload document' };
  }
};

const deleteDocument = async (id) => {
  try {
    const response = await axiosInstance.delete(API_PATHS.DOCUMENTS.DELETE_DOCUMENT(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete document' };
  }
};

const getDocumentById = async (id) => {
  try {
    const response = await axiosInstance.get(API_PATHS.DOCUMENTS.GET_DOCUMENT_BY_ID(id));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch document details' };
  }
};

const documentService = {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentById,
};

export default documentService;