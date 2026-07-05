import type { Settings as LayoutSettings, ProLayoutProps } from '@ant-design/pro-components'
import { SettingDrawer } from '@ant-design/pro-components'
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max'
import { history } from '@umijs/max'
import React from 'react'
import { AvatarDropdown, AvatarName, Footer, Question, SelectLang } from '@/components'
import defaultSettings from '../config/defaultSettings'
import { errorConfig } from './requestErrorConfig'
import { getAuthProfile, getAccessToken, saveAuthSession } from './utils/auth'
import { getCurrentUser, toProfile } from './services/auth'

const isDev = process.env.NODE_ENV === 'development'
const isDevOrTest = isDev || process.env.CI
const loginPath = '/login'

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>
  currentUser?: API.CurrentUser
  loading?: boolean
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>
}> {
  // Use local auth profile instead of calling API
  let profile = getAuthProfile()

  // 如果 profile 存在但缺少 menus（如跨应用 handoff 只传了精简字段），从 API 补全
  if (profile && (!profile.menus || profile.menus.length === 0) && getAccessToken()) {
    try {
      const userData = await getCurrentUser()
      const fullProfile = toProfile(userData)
      saveAuthSession(fullProfile, getAccessToken() ?? undefined)
      profile = fullProfile
    } catch {
      // API 调用失败，继续使用精简 profile
    }
  }

  return {
    fetchUserInfo: async () => {
      return profile
        ? ({
            name: profile.name,
            avatar: '',
            userid: profile.username,
          } as API.CurrentUser)
        : undefined
    },
    currentUser: profile
      ? ({
          name: profile.name,
          avatar: '',
          userid: profile.username,
        } as API.CurrentUser)
      : undefined,
    settings: defaultSettings as Partial<LayoutSettings>,
  }
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  const settings = initialState?.settings as ProLayoutProps & { footerRender?: boolean; menuHeaderRender?: boolean }

  return {
    ...settings,
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: settings?.footerRender !== false ? () => <Footer /> : false,
    onPageChange: () => {
      const { location } = history
      // Only redirect to login if there's no user and we're not on login/register
      if (!initialState?.currentUser && location.pathname !== loginPath && location.pathname !== '/register') {
        // Don't redirect - let the route handle it
      }
    },
    menuHeaderRender: settings?.menuHeaderRender,
    childrenRender: (children) => {
      return (
        <>
          {children}
          {isDevOrTest && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }))
              }}
            />
          )}
        </>
      )
    },
  }
}

export const request: RequestConfig = {
  // API 请求通过 UmiJS proxy 转发到后端，避免跨域 CORS 预检开销
  baseURL: '',
  ...errorConfig,
}
