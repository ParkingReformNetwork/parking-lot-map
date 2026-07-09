/**
 * Icons reference <symbol> definitions in the SVG sprite at the top of index.html.
 */

export type IconName =
  | "arrow-right"
  | "check"
  | "chevron-down"
  | "chevron-up"
  | "circle-question"
  | "circle-xmark"
  | "link"
  | "triangle-exclamation"
  | "up-right-from-square";

export function iconHtml(name: IconName, className?: string): string {
  const classAttr = className ? ` class="${className}"` : "";
  return `<svg${classAttr} aria-hidden="true" width="1em" height="1em"><use href="#icon-${name}"></use></svg>`;
}

export function createIcon(name: IconName, className?: string): SVGSVGElement {
  const template = document.createElement("template");
  template.innerHTML = iconHtml(name, className);
  return template.content.firstChild as SVGSVGElement;
}
