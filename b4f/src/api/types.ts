export interface ErrorPayload {
  status: number
  error: { message: string, code: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ErrorType = any

export interface UserInfoDTO {
  username: string | null
  player: { characters: number }
  master: { campaigns: number }
}

export interface UsernameBody {
  username: string
}

export type CampaignStatus = keyof typeof CampaignTypeEnum
export enum CampaignTypeEnum {
  'active' = 'active',
  'on_hold' = 'on_hold',
  'ended' = 'ended'
}

export type GetCampaignsDTO = ListCampaignDTO[]

export interface ListCampaignDTO {
  id: number
  name: string
  groups: number
  status: CampaignStatus
}

export interface CreateCampaignBody {
  name: string
}

export interface EditCampaignBody {
  name: string
  status: CampaignStatus
}

interface CampaignGroupDTO {
  id: number
  name: string
}

export interface CampaignDTO {
  id: number
  name: string
  description: string
  plot: string
  firstPOI: CampaignPlaceOfInterestDTO | null
  groups: CampaignGroupDTO[]
}

export type PlacesOfInterestType = keyof typeof PlacesOfInterestEnum
export enum PlacesOfInterestEnum {
  'world' = 'world',
  'continent' = 'continent',
  'state' = 'state',
  'region' = 'region',
  'area' = 'area',
  'city' = 'city',
  'camp' = 'camp',
  'neighborhood' = 'neighborhood',
  'point' = 'point'
}

export interface CampaignPlaceOfInterestDTO {
  id: number
  name: string
  place: PlacesOfInterestType
}
