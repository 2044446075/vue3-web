<template>
  <div class="q-my-md">
    <p><b>学生姓名：</b>{{ userStore.name }}</p>
    <p><b>学生学号：</b>{{ userStore.number }}</p>
    <p><b>学生性别：</b>{{ userStore.sex }}</p>
    <p><b>学生年龄：</b>{{ userStore.age }}</p>
    <div class="q-gutter-sm">
      <q-btn
        color="secondary"
        label="修改性别"
        @click="changeSex"
      />
    </div>
    <div class="q-gutter-sm">
      <q-btn
        color="secondary"
        label="保密性别"
        @click="setSex"
      />
    </div>
    <div class="q-gutter-sm">
      <q-btn
        color="secondary"
        label="增加年龄"
        @click="increaseAge"
      />
    </div>
    <div class="q-gutter-sm">
      <q-btn
        color="secondary"
        label="重置数据"
        @click="resetData"
      />
    </div>
  </div>
</template>

<script setup>
import {useUserStore} from 'src/stores/useUserStore'
const userStore = useUserStore()
//修改性别
const changeSex = () => {
  const newSex = userStore.sex === '男' ? '女' : '男'
  userStore.updatesex(newSex)
}
//保密性别
const setSex = () => {
  const newSex = '保密'
  userStore.updatesex(newSex)
}
//增加年龄
const increaseAge = () => {
  const newAge = userStore.age + 1
  userStore.updateage(newAge)
}
//重置数据
const resetData = () => {
  userStore.resetdata()
}
</script>

<style scoped></style>
