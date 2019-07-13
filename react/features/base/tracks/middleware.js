// @flow

import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_MUTED,
    TOGGLE_CAMERA_FACING_MODE,
    toggleCameraFacingMode
} from '../media';
import { MiddlewareRegistry } from '../redux';
import UIEvents from '../../../../service/UI/UIEvents';

import { createLocalTracksA } from './actions';
import {
    TOGGLE_SCREENSHARING,
    TRACK_REMOVED,
    TRACK_UPDATED
} from './actionTypes';
import { getLocalTrack, setTrackMuted } from './functions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

var IsTablet = false;

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

RCTDeviceEventEmitter.addListener('toggleCamera', function(data) {
    Object.keys(data).forEach((key) => {
        if (key == 'isTablet') {
            IsTablet = data[key];
        }
    });
});

declare var APP: Object;

/**
 * Middleware that captures LIB_DID_DISPOSE and LIB_DID_INIT actions and,
 * respectively, creates/destroys local media tracks. Also listens to
 * media-related actions and performs corresponding operations with tracks.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_AUDIO_MUTED:
        _setMuted(store, action, MEDIA_TYPE.AUDIO);
        break;

    case SET_CAMERA_FACING_MODE: {
        // XXX The camera facing mode of a MediaStreamTrack can be specified
        // only at initialization time and then it can only be toggled. So in
        // order to set the camera facing mode, one may destroy the track and
        // then initialize a new instance with the new camera facing mode. But
        // that is inefficient on mobile at least so the following relies on the
        // fact that there are 2 camera facing modes and merely toggles between
        // them to (hopefully) get the camera in the specified state.
        const localTrack = _getLocalTrack(store, MEDIA_TYPE.VIDEO);
        let jitsiTrack;

        if (localTrack
                && (jitsiTrack = localTrack.jitsiTrack)
                && jitsiTrack.getCameraFacingMode()
                    !== action.cameraFacingMode) {
            store.dispatch(toggleCameraFacingMode());
        }
        break;
    }

    case SET_VIDEO_MUTED:
        _setMuted(store, action, MEDIA_TYPE.VIDEO);
        break;

    case TOGGLE_CAMERA_FACING_MODE: {
        const localTrack = _getLocalTrack(store, MEDIA_TYPE.VIDEO);
        let jitsiTrack;

        if (localTrack && (jitsiTrack = localTrack.jitsiTrack)) {
            // XXX MediaStreamTrack._switchCamera is a custom function
            // implemented in react-native-webrtc for video which switches
            // between the cameras via a native WebRTC library implementation
            // without making any changes to the track.
            jitsiTrack._switchCamera();

            // Don't mirror the video of the back/environment-facing camera.
            const mirror
                = jitsiTrack.getCameraFacingMode() === CAMERA_FACING_MODE.USER && !IsTablet;

            store.dispatch({
                type: TRACK_UPDATED,
                track: {
                    jitsiTrack,
                    mirror
                }
            });
        }
        break;
    }

    case TOGGLE_SCREENSHARING:
        if (typeof APP === 'object') {
            APP.UI.emitEvent(UIEvents.TOGGLE_SCREENSHARING);
        }
        break;

    case TRACK_REMOVED:
        // TODO Remove this middleware case once all UI interested in tracks
        // being removed are converted to react and listening for store changes.
        if (typeof APP !== 'undefined' && !action.track.local) {
            APP.UI.removeRemoteStream(action.track.jitsiTrack);
        }
        break;

    case TRACK_UPDATED:
        // TODO Remove the following calls to APP.UI once components interested
        // in track mute changes are moved into React and/or redux.
        if (typeof APP !== 'undefined') {
            const { jitsiTrack } = action.track;
            const muted = jitsiTrack.isMuted();
            const participantID = jitsiTrack.getParticipantId();
            const isVideoTrack = jitsiTrack.isVideoTrack();

            if (isVideoTrack) {
                if (jitsiTrack.isLocal()) {
                    APP.conference.setVideoMuteStatus(muted);
                } else {
                    APP.UI.setVideoMuted(participantID, muted);
                }
                APP.UI.onPeerVideoTypeChanged(
                    participantID,
                    jitsiTrack.videoType);
            } else if (jitsiTrack.isLocal()) {
                APP.conference.setAudioMuteStatus(muted);
            } else {
                APP.UI.setAudioMuted(participantID, muted);
            }
        }

    }

    return next(action);
});

/**
 * Gets the local track associated with a specific {@code MEDIA_TYPE} in a
 * specific redux store.
 *
 * @param {Store} store - The redux store from which the local track associated
 * with the specified {@code mediaType} is to be retrieved.
 * @param {MEDIA_TYPE} mediaType - The {@code MEDIA_TYPE} of the local track to
 * be retrieved from the specified {@code store}.
 * @param {boolean} [includePending] - Indicates whether a local track is to be
 * returned if it is still pending. A local track is pending if
 * {@code getUserMedia} is still executing to create it and, consequently, its
 * {@code jitsiTrack} property is {@code undefined}. By default a pending local
 * track is not returned.
 * @private
 * @returns {Track} The local {@code Track} associated with the specified
 * {@code mediaType} in the specified {@code store}.
 */
function _getLocalTrack(
        { getState }: { getState: Function },
        mediaType: MEDIA_TYPE,
        includePending: boolean = false) {
    return (
        getLocalTrack(
            getState()['features/base/tracks'],
            mediaType,
            includePending));
}

/**
 * Mutes or unmutes a local track with a specific media type.
 *
 * @param {Store} store - The redux store in which the specified action is
 * dispatched.
 * @param {Action} action - The redux action dispatched in the specified store.
 * @param {MEDIA_TYPE} mediaType - The {@link MEDIA_TYPE} of the local track
 * which is being muted or unmuted.
 * @private
 * @returns {void}
 */
function _setMuted(store, { ensureTrack, muted }, mediaType: MEDIA_TYPE) {
    const localTrack
        = _getLocalTrack(store, mediaType, /* includePending */ true);

    if (localTrack) {
        // The `jitsiTrack` property will have a value only for a localTrack for
        // which `getUserMedia` has already completed. If there's no
        // `jitsiTrack`, then the `muted` state will be applied once the
        // `jitsiTrack` is created.
        const { jitsiTrack } = localTrack;

        jitsiTrack && setTrackMuted(jitsiTrack, muted);
    } else if (!muted && ensureTrack && typeof APP === 'undefined') {
        // FIXME: This only runs on mobile now because web has its own way of
        // creating local tracks. Adjust the check once they are unified.
        store.dispatch(createLocalTracksA({ devices: [ mediaType ] }));
    }
}
