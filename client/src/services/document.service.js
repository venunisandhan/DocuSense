import api from './api';

export const getDocuments = async () => {
  const { data } = await api.get('/documents');
  return data.data.documents;
};

export const uploadDocument = async (formData) => {
  const { data } = await api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data.data.document;
};

export const deleteDocument = async (id) => {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
};

export const getDocumentDetails = async (id) => {
  const { data } = await api.get(`/documents/${id}`);
  return data.data.document;
};

export const updateGuidelines = async (id, guidelines) => {
  const { data } = await api.patch(`/documents/${id}/guidelines`, { guidelines });
  return data.data.document;
};
