import * as React from "react";
import Nav from "@rsuite/responsive-nav";
import NavigationLink from "./NavigationLink";

const NavigationBar = () => {
  return (
    <Nav>
      {/* @ts-ignore */}
      <Nav.Item eventKey="A" as={NavigationLink} href="/" locale="en">Item A</Nav.Item>
    </Nav>
  );
};

export default NavigationBar;