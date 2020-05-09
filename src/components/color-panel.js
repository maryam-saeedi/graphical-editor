import React from "react";
import { withStyles } from '@material-ui/core/styles';

import Dialog from '@material-ui/core/Dialog';
import { SketchPicker } from 'react-color';

const colors = [
  "#000000",
  "#464646",
  "#787878",
  "#980031",
  "#ed1d25",
  "#ff7d01",
  "#ffc30e",
  "#a7e71d",
  "#23b14c",
  "#03b8ef",
  "#4c6cf3",
  "#303699",
  "#6e3198",
  "#ffffff",
  "#dcdcdc",
  "#9c593c",
  "#ffa3b1",
  "#e5aa7a",
  "#f5e59c",
  "#fff9be",
  "#d3f9bc",
  "#9cbb60",
  "#99d9eb",
  "#6f99d2",
  "#536c8e",
  "#b5a5d6",
  "transparent"
];

class SelectedColor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      color: this.props.color,
      open: false
    }
    this.handleChangeColor = this.handleChangeColor.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }
  handleChangeColor(color) {
    this.setState({ color: color.hex })
    this.props.handleSetColor(color)
  }
  handleClose(e) {
    this.setState({ open: false })
  }
  handleClick(e) {
    this.setState({ open: true })
  }
  render() {
    const style = {
      width: '25px',
      height: '25px',
      margin: '5px 10px',
      border: '1px solid white',
      outline: '1px solid rgb(180, 180, 180)',
      backgroundColor: this.state.color
    };
    return (
      <div>
        <div onClick={this.handleClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {this.props.title}
          < div style={style} />
        </div>
        <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" open={this.state.open}>
          <SketchPicker
            color={this.state.color}
            onChangeComplete={this.handleChangeColor}
            presetColors={colors}
          />
        </Dialog>
      </div>
    )
  }
}

const Color = props => {
  const style = {
    backgroundColor: props.color,
  };

  return <div className="color" style={style} onClick={props.handleClick} />;
};

export default class ColorPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    }
    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.customColor = this.customColor.bind(this);
  }

  handleClick(event) {
    this.props.handleClick(event);
  }

  customColor(e) {
    this.setState({ open: true })
  }
  handleClose() {
    this.setState({ open: false })
  }

  handleChangeColor(color) {
    console.log(color)
    colors.push(color.hex)
  }

  handleColor(target) {
    const self = this
    const func = self.props.handleClick(target)
    return function (color) {
      func(color)
    }
  }
  render() {
    // const colorItems = colors.map(color => (
    //   <Color color={color} key={color} handleClick={this.handleClick} />
    // ));

    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <SelectedColor color={this.props.selectedStrokeColor} title="Stroke" handleSetColor={this.handleColor('stroke')} />
        <SelectedColor color={this.props.selectedFillColor} title="Fill" handleSetColor={this.handleColor('fill')} />
        {/* <div className="color-panel">{colorItems}</div>
        <div onClick={this.customColor}>Add</div> */}

      </div>
    );
  }
}
