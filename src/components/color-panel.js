import React from "react";
import PropTypes from 'prop-types';

import FormLabel from '@material-ui/core/FormLabel';
import Dialog from '@material-ui/core/Dialog';
import { SketchPicker } from 'react-color';
const colors = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#00ffff",
  "#ff00ff",
  "#ffff00",
  "transparent"
];

class ColorPicker extends React.Component {

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
  componentDidUpdate(prevProps, prevState){
    if(this.state.color != this.props.color){
      this.setState({color: this.props.color})
    }
  }
  handleChangeColor(color) {
    const { closeOnSelect } = this.props
    this.setState({ color: color.hex, open: !closeOnSelect })
    this.props.handleSetColor(color)
  }
  handleClose(e) {
    this.setState({ open: false })
  }
  handleClick(e) {
    this.setState({ open: true })
  }
  render() {
    const { width } = this.props
    const style = {
      width: width,
      height: width,
      margin: 'auto 10px',
      border: '1px solid white',
      outline: '1px solid rgb(180, 180, 180)',
      backgroundColor: this.state.color
    };
    return (
      <div>
        <div onClick={this.handleClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
          {this.props.title && <FormLabel style={{ fontSize: '13px', marginBottom: '3px' }}>{this.props.title}</FormLabel>}
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

ColorPicker.defaultProps = {
  width: '25px',
  closeOnSelect: false
}
export default ColorPicker