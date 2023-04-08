import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faHome,
  faLink,
  faCircleInfo,
  faCircleXmark,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

const setUpIcons = () => {
  library.add(faCircleInfo, faCircleXmark, faHome, faLink, faUpRightFromSquare);
  dom.watch();
};

export default setUpIcons;
