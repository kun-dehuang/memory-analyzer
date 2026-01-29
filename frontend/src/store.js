import { configureStore, createSlice } from '@reduxjs/toolkit'

// 用户状态slice
const userSlice = createSlice({
  name: 'user',
  initialState: {
    isAuthenticated: false,
    user: null,
    token: null
  },
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem('token', action.payload.token)
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      localStorage.removeItem('token')
    },
    setUser: (state, action) => {
      state.user = action.payload
    }
  }
})

// 记忆记录状态slice
const memorySlice = createSlice({
  name: 'memory',
  initialState: {
    records: [],
    currentRecord: null,
    loading: false,
    error: null
  },
  reducers: {
    setRecords: (state, action) => {
      state.records = action.payload
    },
    setCurrentRecord: (state, action) => {
      state.currentRecord = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    }
  }
})

// 提示词状态slice
const promptSlice = createSlice({
  name: 'prompt',
  initialState: {
    groups: [],
    loading: false,
    error: null
  },
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    }
  }
})

// 导出actions
export const { login, logout, setUser } = userSlice.actions
export const { setRecords, setCurrentRecord, setLoading: setMemoryLoading, setError: setMemoryError } = memorySlice.actions
export const { setGroups, setLoading: setPromptLoading, setError: setPromptError } = promptSlice.actions

// 配置store
const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    memory: memorySlice.reducer,
    prompt: promptSlice.reducer
  }
})

export default store
