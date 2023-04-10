import { library, dom } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleInfo,
  faCircleXmark,
  faEarthAmericas,
  faLink,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import "@fortawesome/fontawesome-svg-core/styles.css";

const setUpIcons = () => {
  library.add(
    faCircleInfo,
    faCircleXmark,
    faEarthAmericas,
    faLink,
    faUpRightFromSquare
  );
  dom.watch();
};

export default setUpIcons;