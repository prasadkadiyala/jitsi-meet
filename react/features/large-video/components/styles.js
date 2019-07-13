import { StyleSheet } from 'react-native';

import { ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * Size for the Avatar.
 */
export const AVATAR_SIZE = 200;

export default createStyleSheet({
    /**
     * Large video container style.
     */
    largeVideo: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        flex: 1,
        justifyContent: 'center'
    },

    zoomToastBackground: {
        backgroundColor: ColorPalette.blackTrans,
        width: 400,
        height: 60,
        borderRadius: 5,
        left: 30,
        padding: 5,
        position: 'absolute',
        bottom: 30
    },

    zoomToastIcon: {
        color: ColorPalette.white,
        fontSize: 45,
        position: 'absolute',
        top: 8,
        left: 10,
        padding: 5
    },

    zoomToastTest: {
        fontSize: 20,
        color: ColorPalette.white,
        left: 70,
        top: 15,
        position: 'absolute'
    }
});
