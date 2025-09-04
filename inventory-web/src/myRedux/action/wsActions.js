// src/myRedux/actions/wsActions.js

import { createAction } from '@reduxjs/toolkit';

export const wsConnectStart = createAction('ws/connect/start');
export const wsMessageReceive = createAction('ws/message/receive');
export const wsMessageSend = createAction('ws/message/send');
export const wsConnectSuccess = createAction('ws/connect/success');
export const wsConnectError = createAction('ws/connect/error');
export const wsDisconnect = createAction('ws/disconnect');