import { ColorPalette } from '../../base/styles';

/**
 * Size for the Avatar.
 */
export const AVATAR_SIZE = 50;

/**
 * The base style of {@link Filmstrip} shared between narrow and wide versions.
 */
const filmstrip = {
    flexGrow: 0
};

/**
 * The styles of the feature filmstrip common to both Web and native.
 */
export default {
    /**
     * Dominant speaker indicator style.
     */
    dominantSpeakerIndicator: {
        color: ColorPalette.white,
        fontSize: 15
    },

    /**
     * Dominant speaker indicator background style.
     */
    dominantSpeakerIndicatorBackground: {
        backgroundColor: ColorPalette.blue,
        borderRadius: 15,
        left: 4,
        padding: 5,
        position: 'absolute',
        top: 4
    },

    connectionIndicatorBackground: {
        backgroundColor: ColorPalette.brightGreen,
        borderRadius: 25,
        left: 4,
        padding: 7,
        position: 'absolute',
        top: 4
    },

    thumbnailToolBackground: {
        borderRadius: 28,
        padding: 28,
        margin: 3,
        marginLeft: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
    },

    thumbnailToolBackgroundSmall: {
        borderRadius: 14,
        padding: 14,
        margin: 3,
        marginLeft: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
    },

    thumbnailToolBackgroundMedium: {
        borderRadius: 20,
        padding: 20,
        marginTop: 20,
        marginLeft: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
    },

    marginLeftNegative: {
        marginLeft: -20
    },

    thumbnailToolBackgroundNormal: {
        backgroundColor: ColorPalette.whiteTrans,
    },

    thumbnailToolBackgroundHighlighted: {
        backgroundColor: ColorPalette.orangeTrans,
    },

    thumbnailToolBackgroundDark: {
        backgroundColor: ColorPalette.blackTrans,
    },

    thumbnailToolBackgroundAlert: {
        backgroundColor: ColorPalette.redTrans,
    },

    thumbnailToolBackgroundDisabled: {
        backgroundColor: ColorPalette.greyTrans,
    },

    thumbnailToolIcon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: ColorPalette.black,
        fontSize: 25,
        position: 'absolute'
    },

    thumbnailToolIconNoraml: {
        color: ColorPalette.black,
    },

    thumbnailToolIconPressed: {
        color: ColorPalette.white,
    },

    /**
     * The style of the narrow {@link Filmstrip} version which displays
     * thumbnails in a row at the bottom of the screen.
     */
    filmstripNarrow: {
        ...filmstrip,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        height: 90
    },

    /**
     * The style of the wide {@link Filmstrip} version which displays thumbnails
     * in a column on the short size of the screen.
     */
    filmstripWide: {
        ...filmstrip,
        flexDirection: 'row',
        position: 'absolute',
        justifyContent: 'flex-end',
        width: 500,
        right: 10,
        top: 10
    },

    /**
     * Container of the {@link LocalThumbnail}.
     */
    localThumbnail: {
    },

    /**
     * Moderator indicator style.
     */
    moderatorIndicator: {
        backgroundColor: 'transparent',
        bottom: 4,
        color: ColorPalette.white,
        position: 'absolute',
        right: 4
    },

    /**
     * The style of the scrollview containing the remote thumbnails.
     */
    scrollView: {
        flexGrow: 0
    },

    /**
     * The style of a participant's Thumbnail which renders either the video or
     * the avatar of the associated participant.
     */
    thumbnail: {
        alignItems: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        borderColor: '#424242',
        borderRadius: 0,
        borderStyle: 'solid',
        borderWidth: 1,
        margin: 1,
        overflow: 'hidden',
        position: 'relative'
    },

    thumbnailContainer: {
        height: 300,
        width: 100,
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        margin: 2,
        overflow: 'visible',
        position: 'relative'
    },

    thumbnailTools: {
        position: 'relative',
        height: 70,
        width: 110,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },

    thumbnailToolsSmall: {
        position: 'relative',
        height: 35,
        width: 110,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },

    thumbnailToolsTopMargin: {
        top: 10
    },

    thumbnailToolsMiddleMargin: {
        top: 5
    },

    /**
     * The thumbnail audio and video muted indicator style.
     */
    thumbnailIndicator: {
        backgroundColor: 'transparent',
        color: ColorPalette.white,
        paddingLeft: 1,
        paddingRight: 1,
        position: 'relative'
    },

    /**
     * The thumbnails indicator container.
     */
    thumbnailIndicatorContainer: {
        alignSelf: 'stretch',
        bottom: 4,
        flex: 1,
        flexDirection: 'row',
        left: 4,
        position: 'absolute'
    },

    /**
     * Pinned video thumbnail style.
     */
    thumbnailPinned: {
        borderColor: ColorPalette.blue,
        shadowColor: ColorPalette.black,
        shadowOffset: {
            height: 5,
            width: 5
        },
        shadowRadius: 5
    }
};
