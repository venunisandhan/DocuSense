import api from './api';

export const searchEmployees = async (query) => {
  const { data } = await api.get(`/hr/directory/search?q=${query}`);
  return data.data.users || [];
};

export const getGroups = async () => {
  const { data } = await api.get('/hr/groups');
  return data.data.groups || [];
};

export const createGroup = async (groupData) => {
  const { data } = await api.post('/hr/groups', groupData);
  return data.data.group;
};

export const updateGroup = async (id, groupData) => {
  const { data } = await api.patch(`/hr/groups/${id}`, groupData);
  return data.data.group;
};

export const deleteGroup = async (id) => {
  const { data } = await api.delete(`/hr/groups/${id}`);
  return data;
};
