import React from "react"
import PropTypes from 'prop-types';

class Text extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            x: this.props.x,
            y: this.props.y,
            edit: this.props.edit,
            text: this.props.text,
            stroke: this.props.stroke,
            fill: this.props.fill,
            size: this.props.size,
            bold: this.props.bold,
            font: this.props.font

        }

        this.handleText = this.handleText.bind(this)
        this.handleBlur = this.handleBlur.bind(this)
        this.handleFocus = this.handleFocus.bind(this)
        this.handleDoubleClick = this.handleDoubleClick.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.handleMouseDown = this.handleMouseDown.bind(this)
        this.clickInBoundry = this.clickInBoundry.bind(this)
        this.move = this.move.bind(this)

        this.box = null
        this.child = React.createRef()
    }

    componentDidMount() {
        this.box = this.child.current.getBoundingClientRect()
    }
    componentDidUpdate(prevProps, prevState) {
        if (!this.box || this.box.width != this.child.current.getBoundingClientRect().width || this.box.height != this.child.current.getBoundingClientRect().height) {
            this.box = this.child.current.getBoundingClientRect()
            this.forceUpdate()
            return true
        }
    }
    updateStyle(prop, value) {
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, resolve(1))
        })
    }
    getStyle() {
        const { stroke, fill, bold, font, size } = this.state
        return { stroke, fill, bold, font, size }
    }
    getCorner() {
        return null
    }
    setCorner(corner) { }
    getLocation() {
        return { x: this.state.x, y: this.state.y, w: this.box.width, h: this.box.height }
    }

    handleText(e) {
        this.setState({ text: e.target.value })
    }
    handleBlur() {
        this.setState({ edit: false }, () => this.props.changeShape())
    }
    handleFocus() {
        this.setState({ edit: true })
    }

    handleLogic(logic) {
        this.logic = logic
        console.log(this.logic)
    }
    handleDoubleClick(e) {
        this.props.addLogic(this.props.id, this.logic)
    }
    handleClick(e) {
        this.props.clickInside(this.props.id)
        e.stopPropagation()
        this.setState({ edit: true })
    }
    handleMoving(dx, dy, dw = 0, dh = 0) {
        this.setState({ x: this.state.x + dx, y: this.state.y + dy })
    }
    move(dx, dy) {
        this.setState({ x: this.state.x + dx, y: this.state.y + dy })
        this.props.updateLayout(this.props.id, this.setBoundry())
        this.isMoving = true
    }
    handleMouseDown() {
        this.props.handleBoundryClick(this.props.id)
        this.isMoving = false
    }
    clickInBoundry(e) {
        e.stopPropagation()
        !this.isMoving && this.props.deselect(this.props.id)
    }
    handleAlign(direction, position) {
        switch (direction) {
            case "Up":
                this.setState({ y: position }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
            case "Down":
                this.setState({ y: position - this.box.height }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
            case "Right":
                this.setState({ x: position - this.box.width }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
            case "Left":
                this.setState({ x: position }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
        }
    }

    setBoundry() {
        this.setState({ edit: true })
        return (
            <g>
                <rect x={this.state.x - 5} y={this.state.y - 5} width={this.box.width + 10} height={(this.box.height ? this.box.height : 10) + 10}
                    stroke='gray' stroke-dasharray="5 5" fill='transparent'
                    onMouseDown={this.handleMouseDown}
                    onClick={this.clickInBoundry} />
            </g>
        )
    }
    render() {
        const { x, y, edit, text } = this.state
        const { size, font, bold, stroke, fill } = this.state
        return (
            <g onClick={this.handleClick} onDoubleClick={this.handleDoubleClick} element='Text' props={JSON.stringify(this.state)}>
                {/* <defs>
                    <filter x="-0.2" y="-0.2" width="1.4" height="1.4" id="solid">
                        <feFlood flood-color={fill} flood-opacity="1" result="offsetColor" />
                        <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur" />
                        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                    </filter>
                </defs> */}
                {this.box && <rect x={this.state.x} y={this.state.y} width={this.box.width} height={this.box.height} fill={fill} stroke="none" />}
                <text x={x} y={y + 15} fontFamily={font} fontSize={size} fontWeight={bold ? 'bold' : 'normal'} fill={stroke} ref={this.child}>{text}</text>
                {edit && <foreignObject x={x - 5} y={y - 5} width="100" height="30">

                    <input
                        autoFocus={edit} onChange={this.handleText} onBlur={this.handleBlur} onFocus={this.handleFocus}
                        // placeholder="text"
                        style={{ width: `calc(100% - 10px)`, padding: '5px', border: 'None', color: { stroke }, fontSize: `${size}px`, fontFamily: { font }, outline: 'none', background: 'transparent', color: 'transparent' }}
                    />
                </foreignObject>}
            </g>
        )
    }
}

Text.defaultProps = {
    edit: true,
    text: ' ',
    changeShape: () => {}
}

export default Text