declare module 'atom-message-panel' {
    type MessagePanelViewParams = {
        title: string
        /** set to true will allow the title to contains HTML (default is false)
         */
        rawTitle?: boolean
        /**
         * What should the close button do? hide (default) or destroy
         */
        closeMethod?: boolean
        /**
         * should the panel attach to the "top", "bottom", "left" or "right" (default is bottom)
         */
        position?: 'top' | 'bottom' | 'left' | 'right'
    }

    interface MessagePanelView {
        new (params: MessagePanelViewParams): MessagePanelView

        attach(): void
        show(): void
        hide(): void
        clear(): void
        setTitle(title: string, raw?: boolean): void
        /**
         * fold/unfold the panel
         */
        toggle(): void
        /**
         * unfold the panel
         */
        unfold(): void
        /**
         * clear the body
         */
        clear(): void
        /**
         * add a view to the panel
         */
        add(view: any): void

        /**
         * remove a view from the panel
         */
        remove(index: number): void
        /**
         * get current state informations about your panel
         */
        state(): any
    }
    export const MessagePanelView: MessagePanelView

    type PlainMessageView = any
    export const PlainMessageView: PlainMessageView

    type LineMessageViewParams = {
        /**
         * your message to the people
         */
        message: string

        /**
         * what line are we talking about?
         */
        line: number

        /**
         * so, was that in some other file? (this is optional)
         */
        file?: string

        /**
         * lets be more specific of what we are talking about (this is optional)
         */
        character?: number
        /**
         * lets you display a code snippet inside a pre tag (this is optional)
         */
        preview?: string
        /**
         * adding css classes to your message (this is optional)
         */
        className?: string
    }

    interface LineMessageView {
        new (params: LineMessageViewParams): LineMessageView
    }
    export const LineMessageView: LineMessageView
}
