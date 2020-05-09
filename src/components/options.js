import React from "react";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import lineTypeIcon from "../images/line_style.svg"
import lineWeight from "../images/line.svg";
import cornerTypeIcon from "../images/corner.svg"

const Button = props => {
    const style = {
        __html: props.image
    };

    return (
        <div
            // className={"button " + (props.active ? "selected" : "")}
            dangerouslySetInnerHTML={style}
            // onClick={e => props.handleClick(e, props.name)}
        />
    );
};

export default class Options extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    render() {
        const { corner, lineType, lineWidth } = this.props
        return (
            <div style={{ display: 'flex', flexDirection: 'row', height: '50px' }}>
                <div style={{ display: "flex", alignItems: 'center' }}>
                    <div style={{width:"20px", height:"20px"}} dangerouslySetInnerHTML={{__html: cornerTypeIcon}} />
                    <Select
                        labelId="demo-simple-select-helper-label"
                        id="demo-simple-select-helper"
                        value={corner}
                        onChange={this.props.handleChangeCorner}
                        style={{ width: '100px', margin: '0 20px' }}
                    >
                        <MenuItem value={'round'}>Round</MenuItem>
                        <MenuItem value={'unset'}>Square</MenuItem>
                    </Select>
                </div>
                <div style={{ display: "flex", alignItems: 'center' }}>
                <div style={{width:"20px", height:"20px"}} dangerouslySetInnerHTML={{__html: lineTypeIcon}} />
                    <Select
                        labelId="demo-simple-select-helper-label"
                        id="demo-simple-select-helper"
                        value={lineType}
                        onChange={this.props.handleChangeLineType}
                        style={{ width: '100px', margin: '0 20px' }}
                    >
                        <MenuItem value={0}>Solid</MenuItem>
                        <MenuItem value={10}>Dashed</MenuItem>
                        <MenuItem value={5}>Dotted</MenuItem>
                    </Select>
                </div>
                <div style={{ display: "flex", alignItems: 'center' }}>
                <div style={{width:"20px", height:"20px"}} dangerouslySetInnerHTML={{__html: lineWeight}} />
                    <Slider
                        value={typeof lineWidth === 'number' ? lineWidth : 0}
                        onChange={this.props.handleChangeLineWidth}
                        defaultValue={3}
                        // getAriaValueText={valuetext}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={10}
                        style={{ width: '100px', margin: 'auto 20px 0' }}
                    />
                    {/* <Input
                        value={lineWidth}
                        margin="dense"
                        // onChange={handleInputChange}
                        inputProps={{
                            step: 1,
                            min: 0,
                            max: 10,
                            type: 'number',
                            'aria-labelledby': 'input-slider',
                        }}
                        style={{ width: '30px', margin: '0 10px' }}
                    /> */}
                </div>
                <div>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={this.props.shadow}
                                onChange={this.props.handleShadow}
                                color="primary"
                            />
                        }
                        label="Shadow"
                    />
                </div>
            </div>
        )

    }
}
