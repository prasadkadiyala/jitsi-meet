import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View, Image } from 'react-native';
import { connect } from 'react-redux';
import { Icon } from '../../../base/font-icons';
import GestureRecognizer, {swipeDirections} from 'react-native-swipe-gestures';

import { Audio, MEDIA_TYPE } from '../../../base/media';
import {
    PARTICIPANT_ROLE,
    ParticipantView,
    pinParticipant,
    showParticipantTools,
    hideParticipantTools,
    getParticipantDisplayName
} from '../../../base/participants';
import { Container } from '../../../base/react';
import { getTrackByMediaTypeAndParticipant } from '../../../base/tracks';

import AudioMutedIndicator from './AudioMutedIndicator';
import DominantSpeakerIndicator from './DominantSpeakerIndicator';
import ModeratorIndicator from './ModeratorIndicator';
import { AVATAR_SIZE } from '../styles';
import styles from './styles';
import VideoMutedIndicator from './VideoMutedIndicator';
import { selectParticipant, selectParticipantInLargeVideo } from '../../../large-video/actions';
import { muteMic, toggleFlashlight, setFilmstripVisible } from '../../actions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

export const DEFAULT_THUMBNAIL_HEIGHT = 80;
export const DEFAULT_THUMBNAIL_WIDTH = 100;

/**
 * React component for video thumbnail.
 *
 * @extends Component
 */
class Thumbnail extends Component {
    /**
     * Thumbnail component's property types.
     *
     * @static
     */
    static propTypes = {
        _audioTrack: PropTypes.object,
        _largeVideo: PropTypes.object,
        _videoTrack: PropTypes.object,
        dispatch: PropTypes.func,
        participant: PropTypes.object,
        extendedToolsParticipant: PropTypes.object,
        participantsFlashOn: PropTypes.object,
        _reRedner: PropTypes.object,
        allowToolTips: PropTypes.boolean,
        _hasTorch: PropTypes.boolean,
        _fromZoomParticipantId: PropTypes.object,
        _fromZoomParticipantLevel: PropTypes.object,
        _toZoomParticipantId: PropTypes.object,
        _toZoomParticipantLevel: PropTypes.object
    };

    /**
     * Initializes new Video Thumbnail component.
     *
     * @param {Object} props - Component props.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onPress = this._onPress.bind(this);
        this._onClickMute = this._onClickMute.bind(this);
        this._onClickFlashlight = this._onClickFlashlight.bind(this);
        this._onSwipeRight = this._onSwipeRight.bind(this);
        this._onShowTools = this._onShowTools.bind(this);
        this._onHideTools = this._onHideTools.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const audioTrack = this.props._audioTrack;
        const largeVideo = this.props._largeVideo;
        const participant = this.props.participant;
        const videoTrack = this.props._videoTrack;
        const allowToolTips = this.props.allowToolTips;
        const extendedToolsParticipant = this.props.extendedToolsParticipant;
        const participantsFlashOn = this.props.participantsFlashOn;

        if (!Thumbnail.remoteViewWidth || Thumbnail.remoteViewWidth > DEFAULT_THUMBNAIL_WIDTH) {
            Thumbnail.remoteViewWidth = DEFAULT_THUMBNAIL_WIDTH;
        }
        if (!Thumbnail.remoteViewHeight || Thumbnail.remoteViewHeight > DEFAULT_THUMBNAIL_HEIGHT) {
            Thumbnail.remoteViewHeight = DEFAULT_THUMBNAIL_HEIGHT;
        }

        let style = styles.thumbnail;
        let styleDimension = {
            width: Thumbnail.remoteViewWidth,
            height: Thumbnail.remoteViewHeight
        }

        if (participant.pinned) {
            style = {
                ...style,
                ...styles.thumbnailPinned
            };
        }

        // We don't render audio in any of the following:
        // 1. The audio (source) is muted. There's no practical reason (that we
        //    know of, anyway) why we'd want to render it given that it's
        //    silence (& not even comfort noise).
        // 2. The audio is local. If we were to render local audio, the local
        //    participants would be hearing themselves.
        const audioMuted = !audioTrack || audioTrack.muted;
        const renderAudio = !audioMuted && !audioTrack.local;
        const participantId = participant.id;
        const participantNotInLargeVideo
            = participantId !== largeVideo.participantId;
        const videoMuted = !videoTrack || videoTrack.muted;

        const showTools = extendedToolsParticipant == participantId;

        const flashlightOn = participantsFlashOn && participantsFlashOn.indexOf(participantId) != -1;

        const config = {
            velocityThreshold: 0.1,
            directionalOffsetThreshold: 30
        };

        const hasTorch = this.props._hasTorch;

        const fromZoomParticipantId = this.props._fromZoomParticipantId;
        const fromZoomParticipantLevel = this.props._fromZoomParticipantLevel;
        const toZoomParticipantId = this.props._toZoomParticipantId;
        const toZoomParticipantLevel = this.props._toZoomParticipantLevel;

        // If someone else is zooming, show zoom disabled on the corresponding thumbnail.
        var fromZoomDisabled = false;
        if ((fromZoomParticipantId == participantId && fromZoomParticipantLevel > 1) ||
            (fromZoomParticipantId == 'localuser' && fromZoomParticipantLevel > 1 && participant.local)) {
            fromZoomDisabled = true;
        }

        // If device user is zooming, show zooming active on the corresponding thumbnail.
        var toZoomDisabled = false;
        if (toZoomParticipantId == participantId && toZoomParticipantLevel > 1) {
            toZoomDisabled = true;
        }

        return (
            <View style = { styles.thumbnailContainer }>
                <GestureRecognizer
                    onSwipeRight={this._onSwipeRight}
                    config={config} >

                    <Container
                        onClick = { this._onClick }
                        onPress = { this._onPress }
                        style = { [ style, styleDimension ] }>

                        { renderAudio
                            && <Audio
                                stream
                                    = { audioTrack.jitsiTrack.getOriginalStream() } /> }

                        <ParticipantView
                            avatarSize = { AVATAR_SIZE }
                            participantId = { participantId }
                            showAvatar = { participantNotInLargeVideo }
                            showVideo = { true }
                            zOrder = { 1 }
                            isLargeVideo = { false } />

                        { participant.role === PARTICIPANT_ROLE.MODERATOR
                            && <ModeratorIndicator /> }

                        { participant.dominantSpeaker
                            && <DominantSpeakerIndicator /> }

                        { fromZoomDisabled && <View style = { [ styles.thumbnailToolBackgroundMedium,
                                            styles.thumbnailToolBackgroundDisabled ] }>
                            <Icon
                                name = 'Disabled-Zooming'
                                style = { [ styles.thumbnailToolIcon,
                                            styles.thumbnailToolIconPressed ] } />
                        </View> }

                        { toZoomDisabled && <View style = { [ styles.thumbnailToolBackgroundMedium,
                                            styles.thumbnailToolBackgroundHighlighted ] }>
                            <Icon
                                name = 'Active-Zooming'
                                style = { [ styles.thumbnailToolIcon,
                                            styles.thumbnailToolIconPressed ] } />
                        </View> }

                        <Container
                            style = { styles.thumbnailIndicatorContainer }>
                            { audioMuted
                                && <AudioMutedIndicator /> }

                            { videoMuted
                                && <VideoMutedIndicator /> }
                        </Container>

                    </Container>

                </GestureRecognizer>

                { allowToolTips && !showTools && <Container
                    onClick = { this._onShowTools }
                    style = { [ styles.thumbnailToolsSmall, styles.thumbnailToolsTopMargin ] }>
                    <View style = { [ styles.thumbnailToolBackgroundSmall, styles.thumbnailToolBackgroundDark ] }
                        onPress = { this._onShowTools }>
                        <Icon name = 'atheer-menu-down'
                        style = { [ styles.thumbnailToolIcon, styles.thumbnailToolIconPressed ] } />
                    </View>
                </Container> }

                { allowToolTips && showTools && <Container
                    onClick = { this._onHideTools }
                    style = { [ styles.thumbnailToolsSmall, styles.thumbnailToolsTopMargin ] }>
                    <View style = { [ styles.thumbnailToolBackgroundSmall, styles.thumbnailToolBackgroundDark ] }
                        onPress = { this._onHideTools }>
                        <Icon name = 'atheer-menu-up'
                        style = { [ styles.thumbnailToolIcon, styles.thumbnailToolIconPressed ] } />
                    </View>
                </Container> }

                { showTools && <View>
                    <Container
                        onClick = { this._onClickMute }
                        style = { [ styles.thumbnailTools, styles.thumbnailToolsTopMargin ] }>
                        <View style = { [ styles.thumbnailToolBackground,
                                        audioMuted ? styles.thumbnailToolBackgroundDisabled : styles.thumbnailToolBackgroundNormal ] }
                            onPress = { this._onClickMute }>
                            <Icon name = 'atheer-mic'
                            style = { [ styles.thumbnailToolIcon,
                                    audioMuted ? styles.thumbnailToolIconPressed : styles.thumbnailToolIconNoraml ] } />
                        </View>
                    </Container>
                    <Container
                        onClick = { this._onClickFlashlight }
                        style = { [ styles.thumbnailTools, styles.thumbnailToolsMiddleMargin ] }>
                        <View style = { [ styles.thumbnailToolBackground,
                                        !hasTorch ? styles.thumbnailToolBackgroundDisabled : null,
                                        (hasTorch && flashlightOn) ? styles.thumbnailToolBackgroundHighlighted : null,
                                        (hasTorch && !flashlightOn) ? styles.thumbnailToolBackgroundNormal : null ] }>
                            <Icon name = 'atheer-flashlight'
                            style = { [ styles.thumbnailToolIcon,
                                        (flashlightOn || !hasTorch) ? styles.thumbnailToolIconPressed : styles.thumbnailToolIconNoraml ] } />
                        </View>
                    </Container>

                </View> }

            </View>
        );
    }

    /**
     * Handles click/tap event on the thumbnail.
     *
     * @returns {void}
     */
    _onClick() {
        const { dispatch, participant } = this.props;

        dispatch(pinParticipant(participant.id));
        dispatch(selectParticipantInLargeVideo());
    }

    _onPress() {
        const { dispatch, participant } = this.props;

        dispatch(showParticipantTools(participant.id));
    }

    _onShowTools() {
        const { dispatch, participant } = this.props;

        dispatch(showParticipantTools(participant.id));
    }

    _onHideTools() {
        const { dispatch, participant } = this.props;

        dispatch(hideParticipantTools(null));
    }

    _onClickMute() {
        const { dispatch, participant } = this.props;

        const audioTrack = this.props._audioTrack;
        const audioMuted = !audioTrack || audioTrack.muted;

        if (!audioMuted) {
            dispatch(muteMic(participant.id));
        }

    }

    _onClickFlashlight() {
        const { dispatch, participant } = this.props;

        const participantsFlashOn = this.props.participantsFlashOn;
        const participantId = participant.id;
        const flashlightOn = participantsFlashOn && participantsFlashOn.indexOf(participantId) != -1;

        dispatch(toggleFlashlight(participant.id, !flashlightOn));
    }

    _onSwipeRight(gestureState) {
        const { dispatch, participant } = this.props;

        dispatch(setFilmstripVisible(false));
    }

    static setRemoteViewSize(width, height) {
        Thumbnail.remoteViewWidth = width;
        Thumbnail.remoteViewHeight = height;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrack: Track,
 *      _largeVideo: Object,
 *      _videoTrack: Track
 *  }}
 */
function _mapStateToProps(state, ownProps) {
    // We need read-only access to the state of features/large-video so that the
    // filmstrip doesn't render the video of the participant who is rendered on
    // the stage i.e. as a large video.
    const largeVideo = state['features/large-video'];
    const tracks = state['features/base/tracks'];
    const { participantsFlashOn, reRender, participantsFlashDisabled } = state['features/filmstrip'];
    const id = ownProps.participant.id;
    const name = ownProps.participant.name;
    var hasTorch = false;
    if (name && !name.includes('Admin')) {
        hasTorch = true;
    }
    if (participantsFlashDisabled && participantsFlashDisabled.indexOf(id) != -1) {
        hasTorch = false;
    }
    const audioTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
    const videoTrack
        = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, id);

    var displayname = getParticipantDisplayName(state, id);

    return {
        _audioTrack: audioTrack,
        _largeVideo: largeVideo,
        _videoTrack: videoTrack,
        _reRedner: reRender,
        _hasTorch: hasTorch,
        _fromZoomParticipantId: state['features/large-video'].zoomParticipantId,
        _fromZoomParticipantLevel: state['features/large-video'].zoom,
        _toZoomParticipantId: state['features/large-video'].toZoomParticipantId,
        _toZoomParticipantLevel: state['features/large-video'].toZoomParticipantLevel
    };
}

export default connect(_mapStateToProps)(Thumbnail);
