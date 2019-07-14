/**
 * Create an action for when dominant speaker changes.
 *
 * {
 *     type: DOMINANT_SPEAKER_CHANGED,
 *     participant: {
 *         id: string
 *     }
 * }
 */
export const DOMINANT_SPEAKER_CHANGED = 'DOMINANT_SPEAKER_CHANGED';

/**
 * Create an action for removing a participant from the conference.
 *
 * {
 *     type: KICK_PARTICIPANT,
 *     id: string
 * }
 */
export const KICK_PARTICIPANT = 'KICK_PARTICIPANT';

/**
 * Create an action for muting a remote participant.
 *
 * {
 *     type: MUTE_REMOTE_PARTICIPANT,
 *     id: string
 * }
 */
export const MUTE_REMOTE_PARTICIPANT = 'MUTE_REMOTE_PARTICIPANT';

/**
 * Create an action for when the local participant's display name is updated.
 *
 * {
 *     type: PARTICIPANT_DISPLAY_NAME_CHANGED,
 *     id: string,
 *     name: string
 * }
 */
export const PARTICIPANT_DISPLAY_NAME_CHANGED
    = 'PARTICIPANT_DISPLAY_NAME_CHANGED';

/**
 * Action to signal that ID of participant has changed. This happens when
 * local participant joins a new conference or quits one.
 *
 * {
 *     type: PARTICIPANT_ID_CHANGED,
 *     conference: JitsiConference
 *     newValue: string,
 *     oldValue: string
 * }
 */
export const PARTICIPANT_ID_CHANGED = 'PARTICIPANT_ID_CHANGED';

/**
 * Action to signal that a participant has joined.
 *
 * {
 *     type: PARTICIPANT_JOINED,
 *     participant: Participant
 * }
 */
export const PARTICIPANT_JOINED = 'PARTICIPANT_JOINED';

/**
 * Action to handle case when participant lefts.
 *
 * {
 *     type: PARTICIPANT_LEFT,
 *     participant: {
 *         id: string
 *     }
 * }
 */
export const PARTICIPANT_LEFT = 'PARTICIPANT_LEFT';

/**
 * Action to handle case when info about participant changes.
 *
 * {
 *     type: PARTICIPANT_UPDATED,
 *     participant: Participant
 * }
 */
export const PARTICIPANT_UPDATED = 'PARTICIPANT_UPDATED';

/**
 * The type of the Redux action which pins a conference participant.
 *
 * {
 *     type: PIN_PARTICIPANT,
 *     participant: {
 *         id: string
 *     }
 * }
 */
export const PIN_PARTICIPANT = 'PIN_PARTICIPANT';

/**
 * Action to signal that a hidden participant has joined.
 *
 * {
 *     type: HIDDEN_PARTICIPANT_JOINED,
 *     participant: Participant
 * }
 */
export const HIDDEN_PARTICIPANT_JOINED = 'HIDDEN_PARTICIPANT_JOINED';

/**
 * Action to handle case when hidden participant leaves.
 *
 * {
 *     type: PARTICIPANT_LEFT,
 *     participant: {
 *         id: string
 *     }
 * }
 */
export const HIDDEN_PARTICIPANT_LEFT = 'HIDDEN_PARTICIPANT_LEFT';

export const SHOW_PARTICIPANT_TOOLS = 'SHOW_PARTICIPANT_TOOLS';

export const HIDE_PARTICIPANT_TOOLS = 'HIDE_PARTICIPANT_TOOLS';
