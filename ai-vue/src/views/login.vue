<template>
  <div class="container">
    <div class="title">
      <div class="back-home">
        <el-icon><Back /> </el-icon>
        <el-button style="margin-bottom: 5px" text @click="router.push('/')"
          >返回首页</el-button
        >
      </div>
      <div class="title-text">
        <h2>登录您的账号</h2>
        <p>请输入您的登录信息</p>
      </div>
    </div>
    <div class="form-container">
      <el-form
        ref="ruleFormRef"
        :model="formData"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            size="large"
            placeholder="请输入用户名"
          ></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            size="large"
            placeholder="请输入密码"
            type="password"
            show-password
          ></el-input>
        </el-form-item>
        <el-button
          class="btn"
          size="large"
          type="primary"
          @click="submitForm(ruleFormRef)"
          >登录</el-button
        >
      </el-form>
      <div class="footer">
        <p>还没有账户？<router-link to="/auth/register">去注册</router-link></p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from "vue"
import { login } from "@/api/admin"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
const ruleFormRef = ref()

const formData = reactive({
  username: "",
  password: ""
})
const rules = reactive({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
})

//登录
const router = useRouter()
const submitForm = async (formEl) => {
  if (!formEl) return
  try {
    await formEl.validate()
  } catch (_) {
    return
  }
  try {
    const data = await login(formData)
    if (!data?.token) {
      ElMessage.error("登录失败，请稍后重试")
      return
    }
    localStorage.setItem("token", data.token)
    localStorage.setItem("userInfo", JSON.stringify(data.userInfo))
    ElMessage.success("登录成功")
    if (data.userInfo.userType === 2) {
      router.push("/back/dashboard")
    } else {
      router.push("/")
    }
  } catch (_) {
    // 错误消息已由响应拦截器统一提示
  }
}
</script>
<style scoped lang="scss">
.container {
  width: 384px;
  .title {
    .back-home {
      margin-bottom: 60px;
    }
    .title-text {
      text-align: center;
      h2 {
        font-size: 36px;
        margin-bottom: 10px;
      }
      p {
        font-size: 18px;
        color: #6b7289;
      }
    }
  }
}
.form-container {
  margin-top: 30px;
  .btn {
    margin-top: 40px;
    width: 100%;
  }
  .footer {
    padding: 30px 0;
    text-align: center;
  }
}
</style>
