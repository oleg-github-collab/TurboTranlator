import axios from 'axios';

// Базовий URL
const API_URL = '/api';

// Функції для роботи з перекладами
export const translationService = {
  uploadBook: async (formData) => {
    const response = await axios.post(`${API_URL}/translation/upload-book`, formData);
    return response.data;
  },
  
  calculateCost: async (bookId, modelType) => {
    const response = await axios.post(`${API_URL}/translation/calculate-cost`, { book_id: bookId, model_type: modelType });
    return response.data;
  },
  
  startTranslation: async (bookId, modelType, targetLanguage) => {
    const response = await axios.post(`${API_URL}/translation/start-translation`, {
      book_id: bookId,
      model_type: modelType,
      target_language: targetLanguage
    });
    return response.data;
  },
  
  getJobs: async () => {
    const response = await axios.get(`${API_URL}/translation/jobs`);
    return response.data;
  },
  
  downloadTranslation: async (jobId) => {
    const response = await axios.get(`${API_URL}/translation/download/${jobId}`);
    return response.data;
  }
};

// Функції для роботи з користувачем
export const userService = {
  getProfile: async () => {
    const response = await axios.get(`${API_URL}/user/profile`);
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await axios.put(`${API_URL}/user/profile`, profileData);
    return response.data;
  },
  
  getBalance: async () => {
    const response = await axios.get(`${API_URL}/user/balance`);
    return response.data;
  },
  
  getUserStatus: async () => {
    const response = await axios.get(`${API_URL}/user/status`);
    return response.data;
  }
};

// Функції для роботи з платежами
export const paymentService = {
  createPayment: async (amount) => {
    const response = await axios.post(`${API_URL}/payment/create`, { amount });
    return response.data;
  },
  
  createSubscription: async (planId) => {
    const response = await axios.post(`${API_URL}/payment/subscribe`, { plan_id: planId });
    return response.data;
  },
  
  getSubscriptionPlans: async () => {
    const response = await axios.get(`${API_URL}/payment/plans`);
    return response.data;
  },
  
  getTransactions: async () => {
    const response = await axios.get(`${API_URL}/payment/transactions`);
    return response.data;
  }
};