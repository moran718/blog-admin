import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: JSON.parse(localStorage.getItem('adminUser') || 'null')
  },
  getters: {
    isLoggedIn: state => !!state.user,
    isAdmin: state => state.user && state.user.role === 1
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
      if (user) {
        localStorage.setItem('adminUser', JSON.stringify(user))
      } else {
        localStorage.removeItem('adminUser')
      }
    }
  },
  actions: {
  },
  modules: {
  }
})
