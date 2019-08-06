export enum RouteType {
  // eslint-disable-next-line no-unused-vars
  DIRECTORY = 'directory',
  // eslint-disable-next-line no-unused-vars
  PAGE = 'page'
}

export interface Route {
  type: RouteType
  path: string
  name: string
  ref: string
  meta?: object
}
