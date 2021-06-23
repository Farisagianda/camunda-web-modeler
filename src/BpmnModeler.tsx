import { makeStyles } from "@material-ui/styles";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import CustomBpmnJsModeler from "./bpmnio/bpmn/CustomBpmnJsModeler";
import SvgIcon from "./components/SvgIcon";
import ToggleGroup from "./components/ToggleGroup";
import BpmnEditor, { BpmnModelerOptions, BpmnPropertiesPanelOptions } from "./editor/BpmnEditor";
import XmlEditor, { MonacoOptions } from "./editor/XmlEditor";
import { Event } from "./events/Events";
import { ContentSavedReason, createContentSavedEvent } from "./events/modeler/ContentSavedEvent";

const useStyles = makeStyles(() => ({
    root: {
        height: "100%",
        overflow: "hidden"
    },
    modeToggle: {
        position: "absolute",
        left: "97px",
        bottom: "32px",
        backgroundColor: "rgba(255, 255, 255, 0.87)"
    }
}));

export interface ModelerTabOptions {
    /**
     * This option disables the modeler tab.
     */
    disabled?: boolean;

    /**
     * The options passed to the bpmn-js modeler.
     *
     * CAUTION: When this options object is changed, the old editor instance will be destroyed
     * and a new one will be created without automatic saving!
     */
    bpmnJsOptions?: any;

    /**
     * The options to control the appearance of the properties panel.
     */
    propertiesPanelOptions?: BpmnPropertiesPanelOptions;

    /**
     * The options to control the appearance of the modeler.
     */
    modelerOptions?: BpmnModelerOptions;

    /**
     * The class name to apply to the modeler tab root element.
     */
    className?: string;
}

export interface XmlTabOptions {
    /**
     * This option disables the XML tab.
     */
    disabled?: boolean;

    /**
     * The options to pass to the monaco editor.
     */
    monacoOptions?: MonacoOptions;

    /**
     * The class name applied to the host of the modeler.
     */
    className?: string;
}

interface Props {
    /**
     * The class name applied to the root element.
     */
    className?: string;

    /**
     * The xml to display in the editor.
     */
    xml: string;

    /**
     * Called whenever an event occurs.
     */
    onEvent: (event: Event<any, any>) => void;

    /**
     * Options to customize the modeler tab.
     */
    modelerTabOptions?: ModelerTabOptions;

    /**
     * Options to customize the XML tab.
     */
    xmlTabOptions?: XmlTabOptions;
}

declare type BpmnViewMode = "bpmn" | "xml";

const BpmnModeler: React.FC<Props> = props => {
    const classes = useStyles();

    const {
        onEvent,
        xml,
        modelerTabOptions,
        xmlTabOptions,
        className
    } = props;

    const modelerRef = useRef<CustomBpmnJsModeler>();

    const [mode, setMode] = useState<BpmnViewMode>("bpmn");

    useEffect(() => {
        if (modelerTabOptions?.disabled && !xmlTabOptions?.disabled) {
            setMode("xml");
        }
    }, [modelerTabOptions, xmlTabOptions]);

    const saveFile = useCallback(async (reason: ContentSavedReason) => {
        if (modelerRef.current) {
            const saved = await modelerRef.current?.save();
            onEvent(createContentSavedEvent(saved.xml, saved.svg, reason));
        }
    }, [onEvent]);

    const changeMode = useCallback(async value => {
        if (value !== null && value !== mode) {
            await saveFile("view.changed");
            setMode(value);
        }
    }, [saveFile, mode]);

    if (!xml) {
        return null;
    }

    return (
        <div className={clsx(classes.root, className)}>

            {!modelerTabOptions?.disabled && (
                <BpmnEditor
                    xml={xml}
                    active={mode === "bpmn"}
                    onEvent={onEvent}
                    modelerOptions={modelerTabOptions?.modelerOptions}
                    propertiesPanelOptions={modelerTabOptions?.propertiesPanelOptions}
                    bpmnJsOptions={modelerTabOptions?.bpmnJsOptions}
                    className={modelerTabOptions?.className} />
            )}

            {!xmlTabOptions?.disabled && (
                <XmlEditor
                    xml={xml}
                    active={mode === "xml"}
                    onChanged={value => {
                        onEvent(createContentSavedEvent(
                            value,
                            undefined,
                            "xml.changed"
                        ));
                    }} />
            )}

            {!xmlTabOptions?.disabled && !modelerTabOptions?.disabled && (
                <ToggleGroup
                    className={classes.modeToggle}
                    options={[
                        {
                            id: "bpmn",
                            node: (
                                <SvgIcon
                                    path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71
                                        7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41
                                        0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            )
                        },
                        {
                            id: "xml",
                            node: (
                                <SvgIcon
                                    path="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2
                                        0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                            )
                        }
                    ]}
                    onChange={changeMode}
                    active={mode} />
            )}

        </div>
    );
};

export default BpmnModeler;