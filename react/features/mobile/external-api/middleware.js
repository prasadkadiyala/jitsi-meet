// @flow

import { NativeModules } from 'react-native';

import { getAppProp } from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    JITSI_CONFERENCE_URL_KEY,
    SET_ROOM,
    forEachConference,
    isRoomValid
} from '../../base/conference';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT
} from '../../base/participants'
import { MUTE_MIC,
        TOGGLE_FLASHLIGHT,
        setGlassUi,
        setFilmstripVisible,
        setFilmstripForceHidden,
        updateFlashlightStatus,
        enableFlashlight,
        disableFlashlight } from '../../filmstrip'
import { LOAD_CONFIG_ERROR } from '../../base/config';
import { CONNECTION_FAILED } from '../../base/connection';
import { MiddlewareRegistry } from '../../base/redux';
import { toURLString } from '../../base/util';
import { ENTER_PICTURE_IN_PICTURE } from '../picture-in-picture';
import { STORE_VIDEO_TRANSFORM, VIDEO_CALL_ZOOM_UPDATED } from '../../base/media';
import { selectParticipantInLargeVideo,
        videoCallZoom } from '../../large-video';

const logger = require('jitsi-meet-logger').getLogger(__filename);
const displayNameSplit = ':';

var userHashDict = {};
var jitsiHashDict = {};

var Store: Object;

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var IsGlass = false;

RCTDeviceEventEmitter.addListener('showRemoteView', function(data) {
    Object.keys(data).forEach((key) => {
        if (key == 'userHash') {
            var jitsiId = _getJitsiParticipantId(data[key]);
            if (IsGlass) {
                Store.dispatch(setFilmstripVisible(true));
                if (jitsiId && !jitsiId.includes('localuser')) {
                    Store.dispatch(selectParticipantInLargeVideo(true, jitsiId));
                } else {
                    Store.dispatch(selectParticipantInLargeVideo(true));
                }
            } else {
                Store.dispatch(setFilmstripForceHidden(false));
                Store.dispatch(selectParticipantInLargeVideo(false));
            }

        }
    });
});

RCTDeviceEventEmitter.addListener('hideRemoteView', function() {
    if (IsGlass) {
        Store.dispatch(setFilmstripVisible(false));
    } else {
        Store.dispatch(setFilmstripForceHidden(true));
    }
    Store.dispatch(selectParticipantInLargeVideo(IsGlass));
});

RCTDeviceEventEmitter.addListener('setGlassUI', function() {
    IsGlass = true;
    Store.dispatch(setFilmstripVisible(false));
    Store.dispatch(setGlassUi(true));
    Store.dispatch(selectParticipantInLargeVideo(true));
});

RCTDeviceEventEmitter.addListener('videoCallZoom', function(data) {
    if (Store) {
        var userhash = null;
        var zoom = null;
        var x = null;
        var y = null;
        if (data != null) {
            Object.keys(data).forEach((key) => {
                if (key === 'userhash') {
                    logger.log('Event:videoCallZoom userhash=' + data[key]);
                    userhash = _getJitsiParticipantId(data[key]);
                } else if (key === 'zoom') {
                    logger.log('Event:videoCallZoom zoom=' + data[key]);
                    zoom = data[key];
                } else if (key === 'x') {
                    logger.log('Event:videoCallZoom x=' + data[key]);
                    x = data[key];
                } else if (key === 'y') {
                    logger.log('Event:videoCallZoom y=' + data[key]);
                    y = data[key];
                }
            });
            Store.dispatch(videoCallZoom(userhash, zoom, x, y));
        }
    }
});

RCTDeviceEventEmitter.addListener('disableFlashlight', function(data) {
    if (Store && data != null) {
        var userhash = null;
        Object.keys(data).forEach((key) => {
            if (key === 'userhash') {
                logger.log('Event:disableFlashlight userhash=' + data[key]);
                userhash = _getJitsiParticipantId(data[key]);
            }
        });
        Store.dispatch(disableFlashlight(userhash));
    }
});

RCTDeviceEventEmitter.addListener('enableFlashlight', function(data) {
    if (Store && data != null) {
        var userhash = null;
        Object.keys(data).forEach((key) => {
            if (key === 'userhash') {
                logger.log('Event:enableFlashlight userhash=' + data[key]);
                userhash = _getJitsiParticipantId(data[key]);
            }
        });
        Store.dispatch(enableFlashlight(userhash));
    }
});

RCTDeviceEventEmitter.addListener('updateFlashlightStatus', function(data) {
    if (Store && data != null) {
        var userhash = null;
        var flashlightStatus = null;
        Object.keys(data).forEach((key) => {
            if (key === 'userhash') {
                logger.log('Event:updateFlashlightStatus userhash=' + data[key]);
                userhash = _getJitsiParticipantId(data[key]);
            } else if (key === 'flashlightStatus') {
                logger.log('Event:updateFlashlightStatus flashlightStatus=' + data[key]);
                flashlightStatus = data[key];
            }
        });
        Store.dispatch(updateFlashlightStatus(userhash, flashlightStatus));
    }
});

/**
 * Middleware that captures Redux actions and uses the ExternalAPI module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;

    switch (type) {
    case CONFERENCE_FAILED: {
        const { error, ...data } = action;

        // XXX Certain CONFERENCE_FAILED errors are recoverable i.e. they have
        // prevented the user from joining a specific conference but the app may
        // be able to eventually join the conference. For example, the app will
        // ask the user for a password upon
        // JitsiConferenceErrors.PASSWORD_REQUIRED and will retry joining the
        // conference afterwards. Such errors are to not reach the native
        // counterpart of the External API (or at least not in the
        // fatality/finality semantics attributed to
        // conferenceFailed:/onConferenceFailed).
        if (!error.recoverable) {
            _sendConferenceEvent(store, /* action */ {
                error: _toErrorString(error),
                ...data
            });
        }
        break;
    }

    case CONFERENCE_LEFT:
        jitsiHashDict = [];
        userHashDict = [];
    case CONFERENCE_JOINED:
    case CONFERENCE_WILL_JOIN:
    case CONFERENCE_WILL_LEAVE:
        _sendConferenceEvent(store, action);
        break;

    case CONNECTION_FAILED:
        !action.error.recoverable
            && _sendConferenceFailedOnConnectionError(store, action);
        break;

    case ENTER_PICTURE_IN_PICTURE:
        _sendEvent(store, _getSymbolDescription(type), /* data */ {});
        break;

    case MUTE_MIC:
        _sendEvent(store, _getSymbolDescription(type),
        /* data */ {
            userhash: _getAtheerUserhash(userHashDict[action.participant.id])
        });
        break;

    case TOGGLE_FLASHLIGHT:
        _sendEvent(store, _getSymbolDescription(type),
        /* data */ {
            userhash: _getAtheerUserhash(userHashDict[action.participant.id])
        });
        break;

    case PARTICIPANT_JOINED:
        userHashDict[action.participant.id] = action.participant.name;
        jitsiHashDict[action.participant.name] = action.participant.id;
        _sendEvent(store, _getSymbolDescription(type),
        /* data */ {
            participantId: action.participant.id,
            userhash: _getAtheerUserhash(action.participant.name)
        });
        break;

    case PARTICIPANT_LEFT:
        _sendEvent(store, _getSymbolDescription(type),
        /* data */ {
            participantId: action.participant.id,
            userhash: _getAtheerUserhash(userHashDict[action.participant.id])
        });
        break;

    case VIDEO_CALL_ZOOM_UPDATED:
        var posX = action.transform.posX;
        if (!posX) {
            posX = 0.5;
        }
        var posY = action.transform.posY;
        if (!posY) {
            posY = 0.5;
        }
        _sendEvent(store, _getSymbolDescription(type),
        /* data */ {
            userhash: _getAtheerUserhash(userHashDict[action.participantId]),
            zoom: action.transform.scale.toString(),
            x: posX.toString(),
            y: posY.toString()
        });
        break;

    case LOAD_CONFIG_ERROR: {
        const { error, locationURL } = action;

        _sendEvent(
            store,
            _getSymbolDescription(type),
            /* data */ {
                error: _toErrorString(error),
                url: toURLString(locationURL)
            });
        break;
    }

    case SET_ROOM:
        Store = store;
        _maybeTriggerEarlyConferenceWillJoin(store, action);
        break;
    }

    return result;
});

/**
 * Returns a {@code String} representation of a specific error {@code Object}.
 *
 * @param {Error|Object|string} error - The error {@code Object} to return a
 * {@code String} representation of.
 * @returns {string} A {@code String} representation of the specified
 * {@code error}.
 */
function _toErrorString(
        error: Error | { message: ?string, name: ?string } | string) {
    // XXX In lib-jitsi-meet and jitsi-meet we utilize errors in the form of
    // strings, Error instances, and plain objects which resemble Error.
    return (
        error
            ? typeof error === 'string'
                ? error
                : Error.prototype.toString.apply(error)
            : '');
}

/**
 * Gets the description of a specific {@code Symbol}.
 *
 * @param {Symbol} symbol - The {@code Symbol} to retrieve the description of.
 * @private
 * @returns {string} The description of {@code symbol}.
 */
function _getSymbolDescription(symbol: Symbol) {
    let description = symbol.toString();

    if (description.startsWith('Symbol(') && description.endsWith(')')) {
        description = description.slice(7, -1);
    }

    // The polyfill es6-symbol that we use does not appear to comply with the
    // Symbol standard and, merely, adds @@ at the beginning of the description.
    if (description.startsWith('@@')) {
        description = description.slice(2);
    }

    return description;
}

/**
 * If {@link SET_ROOM} action happens for a valid conference room this method
 * will emit an early {@link CONFERENCE_WILL_JOIN} event to let the external API
 * know that a conference is being joined. Before that happens a connection must
 * be created and only then base/conference feature would emit
 * {@link CONFERENCE_WILL_JOIN}. That is fine for the Jitsi Meet app, because
 * that's the a conference instance gets created, but it's too late for
 * the external API to learn that. The latter {@link CONFERENCE_WILL_JOIN} is
 * swallowed in {@link _swallowEvent}.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action.
 * @returns {void}
 */
function _maybeTriggerEarlyConferenceWillJoin(store, action) {
    const { locationURL } = store.getState()['features/base/connection'];
    const { room } = action;

    isRoomValid(room) && locationURL && _sendEvent(
        store,
        _getSymbolDescription(CONFERENCE_WILL_JOIN),
        /* data */ {
            url: toURLString(locationURL)
        });
}

/**
 * Sends an event to the native counterpart of the External API for a specific
 * conference-related redux action.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action.
 * @returns {void}
 */
function _sendConferenceEvent(
        store: Object,
        action: {
            conference: Object,
            type: Symbol,
            url: ?string
        }) {
    const { conference, type, ...data } = action;

    // For these (redux) actions, conference identifies a JitsiConference
    // instance. The external API cannot transport such an object so we have to
    // transport an "equivalent".
    if (conference) {
        data.url = toURLString(conference[JITSI_CONFERENCE_URL_KEY]);
    }

    _swallowEvent(store, action, data)
        || _sendEvent(store, _getSymbolDescription(type), data);
}

/**
 * Sends {@link CONFERENCE_FAILED} event when the {@link CONNECTION_FAILED}
 * occurs. It should be done only if the connection fails before the conference
 * instance is created. Otherwise the eventual failure event is supposed to be
 * emitted by the base/conference feature.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action.
 * @returns {void}
 */
function _sendConferenceFailedOnConnectionError(store, action) {
    const { locationURL } = store.getState()['features/base/connection'];
    const { connection } = action;

    locationURL
        && forEachConference(
            store,

            // If there's any conference in the  base/conference state then the
            // base/conference feature is supposed to emit a failure.
            conference => conference.getConnection() !== connection)
        && _sendEvent(
        store,
        _getSymbolDescription(CONFERENCE_FAILED),
        /* data */ {
            url: toURLString(locationURL),
            error: action.error.name
        });
}

/**
 * Sends a specific event to the native counterpart of the External API. Native
 * apps may listen to such events via the mechanisms provided by the (native)
 * mobile Jitsi Meet SDK.
 *
 * @param {Object} store - The redux store.
 * @param {string} name - The name of the event to send.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code name}.
 * @private
 * @returns {void}
 */
function _sendEvent(store: Object, name: string, data: Object) {
    // The JavaScript App needs to provide uniquely identifying information to
    // the native ExternalAPI module so that the latter may match the former to
    // the native JitsiMeetView which hosts it.
    const externalAPIScope = getAppProp(store, 'externalAPIScope');

    externalAPIScope
        && NativeModules.ExternalAPI.sendEvent(name, data, externalAPIScope);
}

/**
 * Determines whether to not send a {@code CONFERENCE_LEFT} event to the native
 * counterpart of the External API.
 *
 * @param {Object} store - The redux store.
 * @param {Action} action - The redux action which is causing the sending of the
 * event.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code action}.
 * @returns {boolean} If the specified event is to not be sent, {@code true};
 * otherwise, {@code false}.
 */
function _swallowConferenceLeft({ getState }, action, { url }) {
    // XXX Internally, we work with JitsiConference instances. Externally
    // though, we deal with URL strings. The relation between the two is many to
    // one so it's technically and practically possible (by externally loading
    // the same URL string multiple times) to try to send CONFERENCE_LEFT
    // externally for a URL string which identifies a JitsiConference that the
    // app is internally legitimately working with.
    let swallowConferenceLeft = false;

    url
        && forEachConference(getState, (conference, conferenceURL) => {
            if (conferenceURL && conferenceURL.toString() === url) {
                swallowConferenceLeft = true;
            }

            return !swallowConferenceLeft;
        });

    return swallowConferenceLeft;
}

/**
 * Determines whether to not send a specific event to the native counterpart of
 * the External API.
 *
 * @param {Object} store - The redux store.
 * @param {Action} action - The redux action which is causing the sending of the
 * event.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code action}.
 * @returns {boolean} If the specified event is to not be sent, {@code true};
 * otherwise, {@code false}.
 */
function _swallowEvent(store, action, data) {
    switch (action.type) {
    case CONFERENCE_LEFT:
        return _swallowConferenceLeft(store, action, data);
    case CONFERENCE_WILL_JOIN:
        // CONFERENCE_WILL_JOIN is dispatched to the external API on SET_ROOM,
        // before the connection is created, so we need to swallow the original
        // one emitted by base/conference.
        return true;

    default:
        return false;
    }
}

// TODO(Hao): Remove this function once Web jitsi and Android jitsi is merged
function _getAtheerUserhash(fullUsername) {
    if (!fullUsername) {
        return;
    }
    var splitParts = fullUsername.split(displayNameSplit);
    if (splitParts.length > 1) {
        return splitParts[1];
    }
}

function _getJitsiParticipantId(atheerUserhash) {
    for (var key in jitsiHashDict) {
        if (_getAtheerUserhash(key) == atheerUserhash) {
            return jitsiHashDict[key];
        }
    }
    return 'localuser';
}
