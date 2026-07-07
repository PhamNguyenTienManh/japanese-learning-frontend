import styles from "./DefaultLayout.module.scss";
import classNames from "classnames/bind";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
const cx = classNames.bind(styles);

function DefaultLayout({ children }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isEmbed = searchParams.get('embed') === 'true';

  if (isEmbed) {
    return <div className={cx("wrapper", "embed-mode")}>{children}</div>;
  }

  return (
    <div className={cx("wrapper")}>
      <Header />
      <div className={cx("container")}>
        <div className={cx("content")}>{children}</div>
      </div>
      <Footer />
    </div>
  );
}
DefaultLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
export default DefaultLayout;
