import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleQuestion,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowRight,
  faChevronDown,
  faChevronUp,
  faLink,
  faUpRightFromSquare,
  faCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

const setUpIcons = (): void => {
  library.add(
    faArrowRight,
    faChevronDown,
    faChevronUp,
    faCircleXmark,
    faCircleQuestion,
    faLink,
    faUpRightFromSquare,
    faCheck,
    faTriangleExclamation
  );
  dom.watch();
};

export default setUpIcons;
