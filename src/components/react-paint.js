import React from "react";
import { renderToString } from 'react-dom/server'
import { serialize } from 'react-serialize'
import Options from "./options";
import Toolbox from "./toolbox";
import Content from "./content";
import ColorPanel from "./color-panel";

const defaultColor = "black";
const defaultTool = "Line";

import pencil from "../images/pencil.svg";
import line from "../images/line.svg";
import brush from "../images/brush.svg";
import fill from "../images/fill.svg";
import rectangle from "../images/rectangle.svg";
import text from "../images/text.svg";
import circle from "../images/circle.svg";
import ellipse from "../images/ellipse.svg";
import erase from "../images/erase.svg";
import picker from "../images/picker.svg";
import image from "../images/image.svg";
import move from "../images/move.svg";
import crop from "../images/crop.svg";
import resize from "../images/resize.svg";
import arrow from "../images/arrow.svg";
import bridge from "../images/bridge.svg"
import copy from "../images/copy.svg"

const toolbarItems = [
  // { name: "Pencil", image: pencil },
  { name: "Line", image: line },
  // { name: "Bridge", image: bridge },
  { name: 'Arrow', image: arrow },
  // { name: "Brush", image: brush },
  // { name: "Fill", image: fill },
  { name: "Text", image: text },
  { name: "Rectangle", image: rectangle },
  { name: "Circle", image: circle },
  { name: "Ellipse", image: ellipse },
  { name: "Erase", image: erase },
  // { name: "Picker", image: picker },
  { name: "Image", image: image },
  // { name: "Crop", image: crop },
  // { name: "Resize", image: resize },
  { name: "Move", image: resize },
  { name: "Copy", image: copy },
];

export default class ReactPaint extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stroke: defaultColor,
      fill: "transparent",
      lineWidth: 3,
      lineType: 0,
      shadow: false,
      strong: 10,
      corner: 'round',
      zoom: 1,
      selectedItem: defaultTool,
      toolbarItems: toolbarItems
    };
    this.changeColor = this.changeColor.bind(this);
    this.changeTool = this.changeTool.bind(this);
    this.changeLineType = this.changeLineType.bind(this);
    this.changeCornerType = this.changeCornerType.bind(this)
    this.changeLineWidth = this.changeLineWidth.bind(this);
    this.changeShaow = this.changeShaow.bind(this)
    this.changeZoom = this.changeZoom.bind(this)
    this.changeShadowStrong = this.changeShadowStrong.bind(this)
    this.handleFileBrowser = this.handleFileBrowser.bind(this);
  }

  changeColor(target) {
    // console.log('color', event.target)
    // this.setState({ color: event.target.style.backgroundColor });
    const self = this;
    return function (color) {
      if (target === "stroke") {
        console.log('stroke change')
        self.setState({ stroke: color.hex })
      } else if (target === "fill") {
        console.log('fill change')
        self.setState({ fill: color.hex })
      }
    }
  }

  changeTool(event, tool) {
    this.setState({ selectedItem: tool });
    if (tool === "Image") {
      this.refs.fileUploader.click();
    }
  }

  changeLineType(event) {
    this.setState({ lineType: event.target.value })
  }

  changeCornerType(event) {
    this.setState({ corner: event.target.value })
  }

  changeLineWidth(event, newValue) {
    this.setState({ lineWidth: newValue })
  }
  changeShadowStrong(event, newValue) {
    this.setState({ strong: newValue })
  }

  changeShaow(event) {
    this.setState({ shadow: event.target.checked })
  }
  changeZoom(event, newValue) {
    this.setState({ zoom: newValue })
  }

  handleFileBrowser(event) {
    console.log('file selected')
    var file = event.target.files;
    console.log(file);
    this.setState({ file })
  }

  render() {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Toolbox
            items={this.state.toolbarItems}
            activeItem={this.state.selectedItem}
            handleClick={this.changeTool}
          />
          <div style={{ width: '1px', borderRight: '1px solid gray', margin: '10px 20px' }} />
          <Options
            lineType={this.state.lineType}
            corner={this.state.corner}
            lineWidth={this.state.lineWidth}
            shadow={this.state.shadow}
            strong={this.state.strong}
            zoom={this.state.zoom}
            handleChangeLineType={this.changeLineType}
            handleChangeCorner={this.changeCornerType}
            handleChangeLineWidth={this.changeLineWidth}
            handleShadow={this.changeShaow}
            handleChangeShadowStrong={this.changeShadowStrong}
            handleChangeZoom={this.changeZoom}
            style={{ height: "50px" }}
          />
          <div style={{ width: '1px', borderRight: '1px solid gray', margin: '10px 20px' }} />
          <ColorPanel
            selectedStrokeColor={this.state.stroke}
            selectedFillColor={this.state.fill}
            handleClick={this.changeColor}
          />
        </div>
        <input type="file" id="file" ref="fileUploader" accept="image/*" onChange={this.handleFileBrowser} style={{ display: "none" }} />
        <Content
          // items={this.state.toolbarItems}
          activeItem={this.state.selectedItem}
          // handleClick={this.changeTool}
          strokeColor={this.state.stroke}
          fillColor={this.state.fill}
          lineType={this.state.lineType}
          lineWidth={this.state.lineWidth}
          shadow={this.state.shadow}
          strong={this.state.strong}
          cornerType={this.state.corner}
          file={this.state.file}
          zoom={this.state.zoom}
        />
      </div>
    );
  }
}
