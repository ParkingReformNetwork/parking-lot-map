import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleInfo,
  faCircleXmark,
  faLink,
  faUpRightFromSquare,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

const setUpIcons = () => {
  library.add(
    faCircleInfo,
    faCircleXmark,
    faLink,
    faUpRightFromSquare,
    faCheck
  );
  dom.watch();
};

export default setUpIcons;
