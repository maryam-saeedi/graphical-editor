import React from "react";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import FormLabel from '@material-ui/core/FormLabel';
import IconButton from '@material-ui/core/IconButton';

import lineTypeIcon from "../images/line_style.svg"
import lineWeight from "../images/line.svg";
import cornerTypeIcon from "../images/corner.svg"
import fontIcon from "../images/font.svg"
import fontSizeIcon from "../images/font-size.svg"
import boldIcon from "../images/bold.svg"
import ColorPicker from "./color-panel"

export default class Options extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
        this.handleChangeSelect = this.handleChangeSelect.bind(this)
        this.handleCheckbox = this.handleCheckbox.bind(this)
    }

    handleChangeColor(item) {
        const { handleChangeOption } = this.props
        return function (color) {
            handleChangeOption(item, color.hex)
        }
    }
    handleChangeSelect(item) {
        const { handleChangeOption } = this.props
        return function (event) {
            handleChangeOption(item, event.target.value)
        }
    }
    handleChangeSlider(item) {
        const { handleChangeOption } = this.props
        return function (event, newValue) {
            handleChangeOption(item, newValue)
        }
    }
    handleCheckbox(item) {
        const { handleChangeOption } = this.props
        return function (event) {
            handleChangeOption(item, event.target.checked)
        }
    }
    handleToggleButton(item) {
        const { handleChangeOption } = this.props
        const self = this
        return function (event) {
            handleChangeOption(item, !self.props[item])
        }
    }
    render() {
        const { activeItem } = this.props
        const { corner, dashed, weight, strong, shadow, stroke, fill, zoom, font, size, bold } = this.props.defaultValues
        console.log(activeItem, this.props.defaultValues)
        return (
            <div style={{ display: 'flex', padding: '0 0 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    {(activeItem.has("Shape") || activeItem.has("Line")) &&
                        [
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end' }} >
                                <div style={{ display: "flex", alignItems: 'center' }}>
                                    <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: cornerTypeIcon }} />
                                    <Select
                                        value={corner}
                                        onChange={this.handleChangeSelect('corner')}
                                        style={{ width: '90px', margin: '0 20px 0 10px' }}
                                    >
                                        <MenuItem value={'round'}>Round</MenuItem>
                                        <MenuItem value={'unset'}>Square</MenuItem>
                                    </Select>
                                </div>
                                <div style={{ display: "flex", alignItems: 'center' }}>
                                    <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: lineTypeIcon }} />
                                    <Select
                                        value={dashed}
                                        onChange={this.handleChangeSelect('dashed')}
                                        style={{ width: '90px', margin: '0 20px 0 10px' }}
                                    >
                                        <MenuItem value={0}>Solid</MenuItem>
                                        <MenuItem value={10}>Dashed</MenuItem>
                                        <MenuItem value={5}>Dotted</MenuItem>
                                    </Select>
                                </div>
                                <div style={{ display: "flex", alignItems: 'center' }}>
                                    <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: lineWeight }} />
                                    <Slider
                                        value={typeof weight === 'number' ? weight : 0}
                                        onChange={this.handleChangeSlider('weight')}
                                        defaultValue={3}
                                        // getAriaValueText={valuetext}
                                        aria-labelledby="discrete-slider"
                                        valueLabelDisplay="auto"
                                        step={1}
                                        marks
                                        min={1}
                                        max={10}
                                        style={{ width: '100px', margin: 'auto 20px 0 10px' }}
                                    />
                                </div>
                                <div>
                                    <FormLabel style={{ fontSize: '13px' }}>Shadow</FormLabel>
                                    <div style={{ display: 'flex' }}>
                                        <Checkbox
                                            checked={shadow}
                                            onChange={this.handleCheckbox('shadow')}
                                            color="primary"
                                            style={{ padding: '3px' }}
                                        />
                                        <Slider
                                            value={typeof strong === 'number' ? strong : 0}
                                            onChange={this.handleChangeSlider('strong')}
                                            defaultValue={10}
                                            // getAriaValueText={valuetext}
                                            aria-labelledby="discrete-slider"
                                            valueLabelDisplay="auto"
                                            step={5}
                                            marks
                                            min={5}
                                            max={25}
                                            style={{ width: '100px', margin: 'auto 20px 0 10px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <ColorPicker color={stroke} title="Outline" handleSetColor={this.handleChangeColor('stroke')} />
                                    {activeItem.has("Shape") && <ColorPicker color={fill} title="Fill" handleSetColor={this.handleChangeColor('fill')} />}
                                </div>
                            </div>
                        ]}
                    {activeItem.has("Text") &&
                        <div style={{ display: "flex", flexDirection: 'row', alignItems: 'flex-end' }}>
                            <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: fontIcon }} />
                            <Select
                                value={font}
                                onChange={this.handleChangeSelect('font')}
                                style={{ width: '100px', margin: '0 20px 0 10px' }}
                            >
                                <MenuItem value={"Times New Roman"}>Times New Roman</MenuItem>
                                <MenuItem value={"Comic Sans MS"}>Comic Sans MS</MenuItem>
                            </Select>
                            <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: fontSizeIcon }} />
                            <Select
                                labelId="demo-simple-select-helper-label"
                                id="demo-simple-select-helper"
                                value={size}
                                onChange={this.handleChangeSelect('size')}
                                style={{ width: '50px', margin: '0 20px 0 10px' }}
                            >
                                <MenuItem value={8}>8</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={11}>11</MenuItem>
                                <MenuItem value={12}>12</MenuItem>
                                <MenuItem value={13}>13</MenuItem>
                                <MenuItem value={14}>14</MenuItem>
                                <MenuItem value={16}>16</MenuItem>
                                <MenuItem value={18}>18</MenuItem>
                                <MenuItem value={20}>20</MenuItem>
                            </Select>
                            <IconButton style={{ padding: '5px', borderRadius: '5px', background: bold ? 'lightblue' : 'none' }}
                                onClick={this.handleToggleButton('bold')}>
                                <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: boldIcon }} />
                            </IconButton>
                            {/* <Checkbox
                                checked={bold}
                                onChange={this.handleCheckbox('bold')}
                                color="primary"
                            /> */}
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <ColorPicker color={stroke} title="Text" handleSetColor={this.handleChangeColor('stroke')} />
                                <ColorPicker color={fill} title="Background" handleSetColor={this.handleChangeColor('fill')} />
                            </div>
                        </div>}

                </div>
                {/* <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: zoomin }} />
                    <Slider
                        value={zoom}
                        min={0.5}
                        max={2}
                        step={0.1}
                        onChange={this.props.handleChangeZoom}
                        aria-labelledby="continuous-slider"
                        style={{ width: '100px' }} />
                    <div style={{ width: "20px", height: "20px" }} dangerouslySetInnerHTML={{ __html: zoomout }} />
                </div> */}
            </div>
        )

    }
}
