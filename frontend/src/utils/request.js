import axios from "axios";
import { ElMessage } from "element-plus";

//创建axios实例
const service = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

//创建请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

//响应拦截器
service.interceptors.response.use(
  (response) => {
    const { data, config } = response;
    //处理业务状态码
    if (data.code === "200") {
      return data.data;
    } else if (data.code === '-1') {
      // 登录过期
      ElMessage.error(data.msg || '登录过期，请重新登录')
      if (!config.url?.includes('/login')) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.href = '/auth/Login'
      }
      return Promise.reject(data)
    } else {
      // 其他业务错误码（如 6001 用户不存在、密码错误等）
      ElMessage.error(data.msg || '操作失败')
      return Promise.reject(data)
    }
  },
  (error) => {
    // HTTP 错误（500/404/网络错误等）
    const msg = error?.response?.data?.msg || error?.message || '网络请求失败'
    ElMessage.error(msg)
    return Promise.reject(error)
  },
);

export default service;
