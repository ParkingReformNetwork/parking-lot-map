import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleInfo,
  faCircleXmark,
  faLink,
  faUpRightFromSquare,
  faCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

const setUpIcons = (): void => {
  library.add(
    faCircleInfo,
    faCircleXmark,
    faLink,
    faUpRightFromSquare,
    faCheck,
    faTriangleExclamation
  );
  dom.watch();
};

export default setUpIcons;
