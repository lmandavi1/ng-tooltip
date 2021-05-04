import React, { useEffect, useState } from "react";
import snarkdown from "snarkdown";
import copy from "clipboard-copy";
import { stringify } from "yaml";
import {
  Button,
  Icon,
  Label,
  NavbarHeading as Heading,
  Popover,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import css from "./TooltipEditor.css";

export interface TooltipEditorProps {
  tooltipDictionary: Record<string, string>;
  onClose?: () => void;
}

export const getNodeTooltipId = (node: unknown): string =>
  (node as HTMLElement)?.dataset?.tooltipId || "";

export const TooltipEditor = (props: TooltipEditorProps) => {
  const allTooltips = document.querySelectorAll("[data-tooltip-id]") || [];
  const tooltipDictionary = props.tooltipDictionary;
  const [editedTooltips, setEditedTooltips] = useState<Record<string, string>>(
    typeof localStorage.getItem("tooltipDictionary") === "string"
      ? JSON.parse(localStorage.getItem("tooltipDictionary") || "")
      : tooltipDictionary
  );
  const [editMode, setEditMode] = useState<Record<string, boolean | undefined>>(
    {}
  );

  const [searchResults, setSearchResults] = useState<NodeListOf<Element>>(
    allTooltips
  );

  const indicateTooltipsWithEmptyContent = (
    tooltipNodes: NodeListOf<Element>,
    editedTooltips: Record<string, string>
  ): void => {
    Array.from(tooltipNodes).forEach((tooltipNode) => {
      const tooltipId = getNodeTooltipId(tooltipNode);
      if (tooltipId && !editedTooltips[tooltipId]) {
        // Remove this class on unmount
        tooltipNode.classList.add(css.emptyTooltipContent);
      }
    });
  };

  const removeEmptyContentClass = (tooltipNodes: NodeListOf<Element>) => {
    Array.from(tooltipNodes).forEach((tooltipNode) => {
      if (tooltipNode.classList.contains(css.emptyTooltipContent)) {
        tooltipNode.classList.remove(css.emptyTooltipContent);
      }
    });
  };

  const handleTooltipNodeClick = (tooltipId: string) => {
    setEditMode({
      ...{ [tooltipId]: true },
    });
  };

  const handleTooltipNodeMouseOver = (tooltipId: string) => {
    const labelNode = document.getElementById(tooltipId);
    labelNode?.classList.add(css.bold);
  };

  const handleTooltipNodeMouseOut = (tooltipId: string) => {
    const labelNode = document.getElementById(tooltipId);
    if (labelNode?.classList.contains(css.bold)) {
      labelNode?.classList.remove(css.bold);
    }
  };

  const attachEventHandlersToTooltipNodes = (
    allTooltips: NodeListOf<Element>
  ): void => {
    Array.from(allTooltips).forEach((tooltipNode) => {
      const tooltipId = getNodeTooltipId(tooltipNode);
      tooltipNode.addEventListener("click", () =>
        handleTooltipNodeClick(tooltipId)
      );
      tooltipNode.addEventListener("mouseover", () =>
        handleTooltipNodeMouseOver(tooltipId)
      );
      tooltipNode.addEventListener("mouseout", () =>
        handleTooltipNodeMouseOut(tooltipId)
      );
    });
  };

  const removeEventHandlersFromTooltipNodes = (
    allTooltips: NodeListOf<Element>
  ): void => {
    Array.from(allTooltips).forEach((tooltipNode) => {
      const tooltipId = getNodeTooltipId(tooltipNode);
      tooltipNode.removeEventListener("click", () =>
        handleTooltipNodeClick(tooltipId)
      );
      tooltipNode.removeEventListener("mouseover", () =>
        handleTooltipNodeMouseOver(tooltipId)
      );
      tooltipNode.removeEventListener("mouseout", () =>
        handleTooltipNodeMouseOut(tooltipId)
      );
    });
  };

  const filterDataForSearch = (value: string) => {
    let filtered: NodeListOf<Element> = allTooltips;
    if (!value) {
      setSearchResults(filtered);
    }
    filtered = (Array.from(allTooltips).filter((node) =>
      getNodeTooltipId(node)
        .trim()
        .toLowerCase()
        ?.includes(value.trim().toLowerCase())
    ) as unknown) as NodeListOf<Element>;
    setSearchResults(filtered);
  };

  const addDraggableProperty = (editorbody: HTMLElement) => {
    const draggableHeader = document.getElementById("draggable");

    // Source: https://www.w3schools.com/howto/howto_js_draggable.asp
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

    const elementDrag = (e: MouseEvent) => {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      editorbody.style.top = editorbody.offsetTop - pos2 + "px";
      editorbody.style.left = editorbody.offsetLeft - pos1 + "px";
    };

    const closeDragElement = () => {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    };

    const dragMouseDown = (e: MouseEvent) => {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    };

    if (draggableHeader) {
      draggableHeader.onmousedown = dragMouseDown;
    }
  };

  const cleanup = () => {
    removeEventHandlersFromTooltipNodes(allTooltips);
    removeEmptyContentClass(allTooltips);
  };

  useEffect(() => {
    indicateTooltipsWithEmptyContent(allTooltips, editedTooltips);
  }, [editedTooltips]);

  useEffect(() => {
    attachEventHandlersToTooltipNodes(allTooltips);
    const editorBody = document.getElementById("ngTooltipEditorRoot");
    if (editorBody) {
      addDraggableProperty(editorBody);
    }

    return cleanup;
  }, []);

  const _asHtml = (content: string) => {
    return `${content
      .split("\n\n")
      .map(
        (line) =>
          `<p>${snarkdown(line).replace(
            new RegExp("href=", "g"),
            'target="_blank" href='
          )}</p>`
      )
      .join("")}`;
  };

  return (
    <div>
      <div className={css.editorHeadingRow}>
        <Heading className={css.draggable} id="draggable">
          Total Tooltip ID(s) in context - {allTooltips?.length}
        </Heading>
        <input
          className={css.searchInput}
          placeholder="Search for ID"
          onChange={(event) => filterDataForSearch((event.target as any).value)}
        />
        <Icon
          icon="cross"
          className={css.closeButton}
          onClick={() => props.onClose?.()}
        />
      </div>
      <div className={css.learnMore}>
        <Icon icon="info-sign" />
        <div className={css.learnMoreText}>
          Learn more about the new tooltip framework{" "}
          <a
            href="https://harness.atlassian.net/wiki/spaces/CDNG/pages/1626144816/NG+Tooltip+Framework+-+self+help+guide+for+docs"
            target="_blank"
          >
            here
          </a>
        </div>
      </div>
      {allTooltips?.length ? (
        <div className={css.tooltipContentWrapper}>
          <div className={css.tooltipEditRow}>
            <Heading className={css.tooltipIdLabelHeading}>ID</Heading>
            <Heading>
              <label>
                Tooltip Content (Markdown)&nbsp;
                <a
                  title="See Markdown examples"
                  href="//jsfiddle.net/tnhu/s6x4bmpq/"
                  target="_blank"
                >
                  See how markdowns work?
                </a>
              </label>
            </Heading>
          </div>
          {Array.from(searchResults).map((node) => {
            const tooltipId = getNodeTooltipId(node);
            return (
              <div className={css.tooltipEditRow} key={tooltipId}>
                <Label
                  className={css.tooltipIdLabel}
                  id={tooltipId}
                  onMouseOver={() => {
                    node.classList.add(css.bold);
                  }}
                  onMouseOut={() => {
                    if (node.classList.contains(css.bold)) {
                      node.classList.remove(css.bold);
                    }
                  }}
                >
                  {tooltipId}
                </Label>
                {editMode[tooltipId] ? (
                  <textarea
                    placeholder="Enter Markdown"
                    style={{
                      minWidth: 400,
                      minHeight: 100,
                      padding: "15px",
                      marginLeft: "15px",
                    }}
                    value={editedTooltips[tooltipId]}
                    id={`${tooltipId}TextArea`}
                    autoFocus={true}
                    onChange={(e) => {
                      setEditedTooltips({
                        ...editedTooltips,
                        ...{ [tooltipId]: e.target.value },
                      });
                    }}
                  />
                ) : (
                  <div className={css.labelRow}>
                    <Label>{editedTooltips[tooltipId] || ""}</Label>
                    <Button
                      text="Edit"
                      icon="edit"
                      className={css.editIcon}
                      onClick={() => {
                        setEditMode({
                          ...{ [tooltipId]: true },
                        });
                      }}
                    />
                  </div>
                )}
                {editedTooltips[tooltipId] ? (
                  <Popover
                    popoverClassName={css.previewTooltipWrapper}
                    position={Position.RIGHT}
                    usePortal={false}
                    interactionKind={PopoverInteractionKind.HOVER}
                    content={
                      <div
                        className={css.previewTooltipContentWrapper}
                        dangerouslySetInnerHTML={{
                          __html: _asHtml(editedTooltips[tooltipId]),
                        }}
                      />
                    }
                  >
                    <span className={css.previewLabel}>Preview</span>
                  </Popover>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={css.noTooltips}>
          No toolip IDs found in the present context.
        </div>
      )}
      {allTooltips?.length ? (
        <div className={css.buttons}>
          <Button
            intent="primary"
            icon="clipboard"
            text="Copy to clipboard"
            onClick={() => copy(stringify(editedTooltips))}
          />
          <Button
            className={css.secondButton}
            text="Save"
            icon="saved"
            onClick={() => {
              localStorage.setItem(
                "tooltipDictionary",
                JSON.stringify(editedTooltips)
              );
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
