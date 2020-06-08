import React from "react";
import { renderToString } from 'react-dom/server'
import { serialize } from 'react-serialize'
import Options from "./options";
import Toolbox from "./toolbox";
import Menu from "./menu"
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
import triangle from "../images/triangle.svg"
import erase from "../images/erase.svg";
import picker from "../images/picker.svg";
import image from "../images/image.svg";
import move from "../images/move.svg";
import crop from "../images/crop.svg";
import resize from "../images/resize.svg";
import arrow from "../images/arrow.svg";
import bridge from "../images/bridge.svg"
import copy from "../images/copy.svg"
import align from "../images/align.svg"
import align_top from "../images/align_top.svg"
import align_bottom from "../images/align_bottom.svg"
import align_right from "../images/align_right.svg"
import align_left from "../images/align_left.svg"
import dist_horizontal from "../images/distribute_horizontal.svg"
import dist_vertical from "../images/distribute_vertical.svg"
import arrange from "../images/arrange.svg"
import bring_front from "../images/bring_front.svg"
import send_back from "../images/send_back.svg"

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
  { name: "Triangle", image: triangle },
  { name: "Erase", image: erase },
  // { name: "Picker", image: picker },
  { name: "Image", image: image },
  // { name: "Crop", image: crop },
  // { name: "Resize", image: resize },
  { name: "Move", image: resize },
  { name: "Copy", image: copy },
];
const alignItems = [
  {
    name: 'align',
    sub: [{ name: 'Align Right', image: align_right },
    { name: 'Align Left', image: align_left },
    { name: 'Align Top', image: align_top },
    { name: 'Align Bottom', image: align_bottom },
    { name: 'Distribute Horizontally', image: dist_horizontal },
    { name: 'Distribute Vertically', image: dist_vertical }
    ],
    image: align
  },
  {
    name: 'arrange',
    sub: [{ name: 'Bring To Front', image: bring_front },
    { name: 'Send To Back', image: send_back }],
    image: arrange
  }
]
const categories = {
  'Line': 'Line',
  'Arrow': 'Line',
  'Rectangle': 'Shape',
  'Circle': 'Shape',
  'Ellipse': 'Shape',
  'Triangle': 'Shape',
  'Text': 'Text'
}
const defaultOption = {
  stroke: defaultColor,
  fill: "transparent",
  weight: 3,
  dashed: 0,
  shadow: false,
  strong: 10,
  corner: 'round',
  zoom: 1,
  font: "Times New Roman",
  size: 12,
  bold: false,
  width: 0,
  height: 0,
}

export default class ReactPaint extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stroke: defaultColor,
      fill: "transparent",
      weight: 3,
      dashed: 0,
      shadow: false,
      strong: 10,
      corner: 'round',
      zoom: 1,
      font: "Times New Roman",
      size: 12,
      bold: false,
      width: 0,
      height: 0,
      align: '',
      selectedItem: defaultTool,
      currentItem: new Set([categories[defaultTool]]),
      defaultValues: defaultOption,
      currentValues: defaultOption,
      toolbarItems: toolbarItems
    };
    this.changeTool = this.changeTool.bind(this);
    this.changeAlign = this.changeAlign.bind(this)
    // this.changeZoom = this.changeZoom.bind(this)
    this.handleFileBrowser = this.handleFileBrowser.bind(this);
    this.changeOption = this.changeOption.bind(this)
    this.selectItem = this.selectItem.bind(this)
  }

  changeTool(event, tool) {
    this.setState({ selectedItem: tool, currentItem: new Set([categories[tool]]), currentValues: { ...this.state.defaultValues } });
    if (tool === "Image") {
      this.refs.fileUploader.click();
    }
  }
  changeAlign(name) {
    this.setState({ align: name }, () => this.setState({ align: '' }))

  }

  selectItem(item, values) {
    item && this.setState({ currentItem: item })
    this.setState({ currentValues: { ...this.state.defaultValues, ...values } })
  }
  changeOption(target, value) {
    this.setState({ [target]: this.state.currentValues[target] }, 
      () => this.setState({ [target]: value, defaultValues: { ...this.state.defaultValues, [target]: value }, currentValues: { ...this.state.defaultValues, [target]: value } }))
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
        <div style={{ display: 'flex', flexDirection: 'row', height: '77px' }}>
          <Toolbox
            items={this.state.toolbarItems}
            activeItem={this.state.selectedItem}
            handleClick={this.changeTool}
          />
          <div style={{ width: '1px', borderRight: '1px solid gray', margin: '10px 10px' }} />
          <Options
            activeItem={this.state.currentItem}
            dashed={this.state.dashed}
            corner={this.state.corner}
            weight={this.state.weight}
            shadow={this.state.shadow}
            strong={this.state.strong}
            zoom={this.state.zoom}
            font={this.state.font}
            bold={this.state.bold}
            size={this.state.size}
            // handleChangeZoom={this.changeZoom}
            handleChangeOption={this.changeOption}
            stroke={this.state.stroke}
            fill={this.state.fill}
            defaultValues={this.state.currentValues}
            style={{ height: "50px" }}
          />
          <div style={{ width: '1px', borderRight: '1px solid gray', margin: '10px 10px' }} />
          <Menu
            items={alignItems}
            // activeItem={this.state.selectedItem}
            handleClick={this.changeAlign}
          />
        </div>
        <input type="file" id="file" ref="fileUploader" accept="image/*" onChange={this.handleFileBrowser} style={{ display: "none" }} />
        <Content
          // items={this.state.toolbarItems}
          activeItem={this.state.selectedItem}
          alignType={this.state.align}
          changeTool={this.changeTool}
          stroke={this.state.stroke}
          fill={this.state.fill}
          dashed={this.state.dashed}
          weight={this.state.weight}
          shadow={this.state.shadow}
          strong={this.state.strong}
          font={this.state.font}
          size={this.state.size}
          bold={this.state.bold}
          cornerType={this.state.corner}
          width={this.state.width}
          height={this.state.height}
          file={this.state.file}
          zoom={this.state.zoom}
          selectItem={this.selectItem}
        />
      </div>
    );
  }
}
