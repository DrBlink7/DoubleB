import { type FC, useCallback, useEffect, Fragment, useState } from 'react'
import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Stack, useTheme } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDragon, faDice } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../Utils/store'
import {
  clearMasterState,
  createACampaign,
  deleteACampaign,
  editACampaign,
  retrieveMasterInfo,
  selectCampaigns,
  selectCampaignsInfoStatus,
  selectErrorMessage,
  setErrorMessage
} from '../Store/master'
import { clearUserState, selectToken } from '../Store/users'
import { CampaignTypeEnum, parseErrorMessage } from '../Utils/f'
import { clearPlayerState } from '../Store/player'
import { useNavigate } from 'react-router-dom'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { InfoOutlined } from '@mui/icons-material'
import HomeIcon from '@mui/icons-material/Home'
import LogoutIcon from '@mui/icons-material/Logout'
import NewIcon from '@mui/icons-material/FiberNew'
import useGoogleLoginWithRedux from '../Hooks/useGoogleLoginWithRedux'
import UserInfo from './UserInfo'
import ImageLayout from '../Components/ImageLayout'
import Loader from '../Components/Loader'
import ErrorComponent from '../Components/Error'
import CustomOptionsModal from '../Components/CustomOptionsModal'
import Item from '../Components/CampaignItem'
import ConfirmationDialog from '../Components/ConfirmationDialog'
import bg from '../Images/rpg_pal.jpeg'
import * as ls from '../Utils/ls'
import * as Yup from 'yup'

const Campaign: FC = () => {
  const { t } = useTranslation()
  const { logOut } = useGoogleLoginWithRedux()
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [createCampaign, setCreateCampaign] = useState<boolean>(false)
  const [userInfo, setUserInfo] = useState<boolean>(false)
  const [editCampaign, setEditCampaign] = useState<number>(0)
  const [deleteCampaign, setDeleteCampaign] = useState<number>(0)
  const [activeCampaign, setActiveCampaign] = useState<number>(0)

  const token = useAppSelector(selectToken)
  const campaignsStatus = useAppSelector(selectCampaignsInfoStatus)
  const campaingsInfo = useAppSelector(selectCampaigns)
  const errorMessage = useAppSelector(selectErrorMessage)

  const {
    control: controlCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: errorsCreate }
  } = useForm<CreateCampaignInputs>({
    resolver: yupResolver(Yup.object().shape({
      campaign: Yup.string()
        .required(t('campaign.validationErrorRequired'))
        .max(32, t('campaign.validationErrorTooLong'))
        .trim()
        .test('safe-string', t('campaign.validationErrorInvalid'), (value) => !((value !== null && value !== undefined) && /[<>&'"]/.test(value)))
    })),
    defaultValues: {
      campaign: ''
    }
  })

  const {
    control: controlEdit, handleSubmit: handleSubmitEdit, formState: { errors: errorsEdit }, reset: resetEdit, setValue
  } = useForm<EditCampaignInputs>({
    resolver: yupResolver(Yup.object().shape({
      campaign: Yup.string()
        .required(t('campaign.validationErrorRequired'))
        .max(32, t('campaign.validationErrorTooLong'))
        .trim()
        .test('safe-string', t('campaign.validationErrorInvalid'), (value) => !((value !== null && value !== undefined) && /[<>&'"]/.test(value))),
      status: Yup.string()
        .required(t('campaign.statusvalidationErrorRequired'))
        .oneOf(['active', 'on_hold', 'ended'], t('campaign.validationErrorInvalidStatus'))
    })),
    defaultValues: { campaign: '', status: 'active' }
  })

  const clearError = useCallback(() => {
    dispatch(clearMasterState())
  }, [dispatch])

  const goToHome = useCallback(() => {
    navigate('/home')
  }, [navigate])

  const openUserInfo = useCallback(() => {
    setUserInfo(true)
  }, [])

  const closeUserInfo = useCallback(() => {
    setUserInfo(false)
  }, [])

  const handleLogOut = useCallback(() => {
    dispatch(clearUserState())
    dispatch(clearPlayerState())
    dispatch(clearMasterState())

    ls.del('rpgPal')
    logOut()
  }, [dispatch, logOut])

  const openCreateCampaign = useCallback(() => {
    setCreateCampaign(true)
  }, [])

  const closeCreateCampaign = useCallback(() => {
    resetCreate()
    setCreateCampaign(false)
  }, [resetCreate])

  const openEditCampaign = useCallback((id: number) => {
    setEditCampaign(id)
  }, [])

  const closeEditCampaign = useCallback(() => {
    setEditCampaign(0)
  }, [])

  const setCampaign = useCallback((id: number) => {
    console.log('qui cambio di pagina', id)
    setActiveCampaign(id)
  }, [])

  const openDeleteCampaign = useCallback((id: number) => {
    setDeleteCampaign(id)
  }, [])

  const closeDeleteCampaign = useCallback(() => {
    setDeleteCampaign(0)
  }, [])

  const handleDelete = useCallback(async () => {
    if (deleteCampaign === 0) return
    try {
      await dispatch(deleteACampaign({ token, id: deleteCampaign }))
      setDeleteCampaign(0)
      setActiveCampaign(0)
    } catch (e) {
      dispatch(setErrorMessage(typeof e === 'string' ? e : String(e)))
    }
  }, [deleteCampaign, dispatch, token])

  const onSubmitCreate: SubmitHandler<CreateCampaignInputs> = useCallback(async (data) => {
    try {
      await dispatch(createACampaign({ name: data.campaign, token }))
      setCreateCampaign(false)
      resetCreate()
    } catch (e) {
      const msg = parseErrorMessage((e))
      dispatch(setErrorMessage(msg))
    }
  }, [dispatch, resetCreate, token])

  const onSubmitEdit: SubmitHandler<EditCampaignInputs> = useCallback(async (data) => {
    try {
      if (data.status !== 'active' && data.status !== 'on_hold' && data.status !== 'ended') return

      await dispatch(editACampaign({ name: data.campaign, status: data.status, token, id: editCampaign }))
      setEditCampaign(0)
      resetEdit()
    } catch (e) {
      const msg = parseErrorMessage((e))
      dispatch(setErrorMessage(msg))
    }
  }, [dispatch, token, editCampaign, resetEdit])

  useEffect(() => {
    (async () => {
      try {
        await dispatch(retrieveMasterInfo({ token }))
      } catch (e) {
        const msg = parseErrorMessage((e))
        dispatch(setErrorMessage(msg))
      }
    })()
      .catch(e => {
        const msg = parseErrorMessage((e))
        dispatch(setErrorMessage(msg))
      })
  }, [token, dispatch])

  if (campaignsStatus === 'loading') return <Loader />
  if (campaignsStatus === 'error') return <ErrorComponent clearError={clearError} msg={errorMessage} />

  return <Stack display='flex' width='100vw' height='100vh' flexDirection='row' overflow='hidden'>
    <ConfirmationDialog
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      confirm={handleDelete}
      undo={closeDeleteCampaign}
      open={Boolean(deleteCampaign)}
      title={t('campaign.deleteTitle')}
      dialogText={`${t('campaign.deleteText')}'${deleteCampaign}'`}
    />
    <UserInfo
      onClose={closeUserInfo}
      open={userInfo}
    />
    <CustomOptionsModal
      onClose={closeCreateCampaign}
      handleSubmit={handleSubmitCreate}
      onSubmit={onSubmitCreate}
      open={createCampaign}
      control={controlCreate}
      icon={<FontAwesomeIcon icon={faDice} />}
      firstError={errorsCreate?.campaign}
      title={t('campaign.create')}
      editText={t('campaign.createButton')}
      name="create_campaign"
      firstLabel="campaign"
    />
    <CustomOptionsModal
      onClose={closeEditCampaign}
      handleSubmit={handleSubmitEdit}
      onSubmit={onSubmitEdit}
      open={Boolean(editCampaign)}
      control={controlEdit}
      firstError={errorsEdit?.campaign}
      secondError={errorsEdit?.status}
      options={
        Object
          .keys(CampaignTypeEnum)
          .map(key => ({
            id: key,
            name: t(`campaign.${key}`)
          }))
      }
      icon={<FontAwesomeIcon icon={faDice} />}
      name="edit_campaign"
      firstLabel="campaign"
      secondLabel="status"
      title={t('campaign.edit')}
      editText={t('campaign.editButton')}
    />
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
        width: '250px',
        color: theme.palette.primary.main,
        backgroundColor: theme.palette.background.paper
      }}
      component={Paper}
      elevation={10}
      data-testid="campaign-component"
    >
      <List
        sx={{
          width: '100%',
          height: '100%'
        }}
        data-testid="campaign-list"
      >
        <ListItem sx={{ paddingBottom: '16px', height: '66px' }}>
          <ListItemText
            sx={{ my: 0 }}
            primary={t('campaign.title')}
            primaryTypographyProps={{
              fontSize: '2rem',
              letterSpacing: 0
            }}
            data-testid="campaign-list-title"
          />
          <ListItemIcon sx={{ fontSize: '1.5rem', color: theme.palette.primary.main }}>
            <FontAwesomeIcon icon={faDragon} data-testid="campaign-list-title-icon" />
          </ListItemIcon>
        </ListItem>
        <Divider />
        <Box display='flex' flexDirection='column' height='calc(100% - 59px)' justifyContent='space-between'>
          <Box display='flex' flexDirection='column'>
            {
              campaingsInfo.length === 0
                ? <Fragment>
                  <ListItemButton
                    onClick={openCreateCampaign}
                    sx={{
                      display: 'flex',
                      width: '100%',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        '& .MuiListItemIcon-root': {
                          color: theme.palette.primary.contrastText
                        }
                      },
                      justifyContent: 'space-between'
                    }}
                    data-testid="campaign-list-create"
                  >
                    <ListItemText data-testid="campaign-list-create-text">{t('campaign.new')}</ListItemText>
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        color: theme.palette.primary.main
                      }}
                    >
                      <NewIcon />
                    </ListItemIcon>
                  </ListItemButton>
                  <Divider />
                </Fragment>
                : campaingsInfo.map(campaign =>
                  <Item
                    campaign={campaign}
                    key={campaign.id}
                    activeCampaign={activeCampaign}
                    openEditCampaign={openEditCampaign}
                    openDeleteCampaign={openDeleteCampaign}
                    setValue={setValue}
                    setActiveCampaign={setCampaign}
                  />
                )
            }
          </Box>
          <Box display='flex' flexDirection='column'>
            <Divider />
            <ListItemButton
              sx={{
                display: 'flex',
                width: '100%',
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText
                  }
                },
                justifyContent: 'space-between'
              }}
              onClick={openUserInfo}
              data-testid="campaign-list-user"
            >
              <ListItemText data-testid="campaign-list-user-title">{t('campaign.user')}</ListItemText>
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  color: theme.palette.primary.main
                }}
              >
                <InfoOutlined />
              </ListItemIcon>
            </ListItemButton>
            <Divider />
            <ListItemButton
              sx={{
                display: 'flex',
                width: '100%',
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText
                  }
                },
                justifyContent: 'space-between'
              }}
              onClick={goToHome}
              data-testid="campaign-list-home"
            >
              <ListItemText data-testid="campaign-list-home-title">{t('campaign.home')}</ListItemText>
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  color: theme.palette.primary.main
                }}
              >
                <HomeIcon />
              </ListItemIcon>
            </ListItemButton>
            <Divider />
            <ListItemButton
              sx={{
                display: 'flex',
                width: '100%',
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText
                  }
                },
                justifyContent: 'space-between'
              }}
              onClick={handleLogOut}
              data-testid="campaign-list-logout"
            >
              <ListItemText data-testid="campaign-list-logout-text">{t('campaign.logout')}</ListItemText>
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  color: theme.palette.primary.main
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
            </ListItemButton>
          </Box>
        </Box>
      </List>
    </Box>
    {activeCampaign === 0
      ? <ImageLayout
        url={bg}
        style={{ width: 'calc(100% - 250px)', height: '100%', backgroundColor: 'unset' }}
      />
      : <Fragment>{activeCampaign}</Fragment>
    }
  </Stack>
}

export default Campaign
