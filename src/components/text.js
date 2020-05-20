import React from "react"
import { transparent } from "material-ui/styles/colors";

class Text extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            x: this.props.x,
            y: this.props.y,
            edit: true,
            text: this.props.text,
            stroke: this.props.stroke,
            fill: this.props.fill,
            weight: this.props.weight,
            box: null
        }

        this.handleText = this.handleText.bind(this)
        this.handleBlur = this.handleBlur.bind(this)
        this.handleDoubleClick = this.handleDoubleClick.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.handleMouseDown = this.handleMouseDown.bind(this)
        this.move = this.move.bind(this)

        this.child = React.createRef()
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.box || prevState.box.x != this.child.current.getBBox().x || prevState.box.y != this.child.current.getBBox().y || prevState.box.width != this.child.current.getBBox().width || prevState.box.height != this.child.current.getBBox().height)
            this.setState({ box: this.child.current.getBBox() })
    }
    updateStyle(prop, value) {
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, resolve(1))
        })
    }

    handleText(e) {
        this.setState({ text: e.target.value })
    }
    handleBlur() {
        this.setState({ edit: false })
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
    }
    handleMoving(dx, dy, dw = 0, dh = 0) {
        this.setState({ x: this.state.x + dx, y: this.state.y + dy })
    }
    move(dx, dy) {
        this.setState({ x: this.state.x + dx, y: this.state.y + dy })
    }
    handleMouseDown() {
        this.props.handleBoundryClick(this.props.id)
    }
    setBoundry() {
        const { x, y } = this.state
        // return (
        //     <g onClick={e => e.stopPropagation()}>
        //         <rect x={x - 2} y={y - 25 - 2} width={100} height={30} stroke='gray' stroke-dasharray="5 5" fill='transparent' />
        //     </g>
        // )
    }
    render() {
        const { x, y, edit, text, box } = this.state
        console.log(box) 
        const { weight, stroke, fill } = this.state
        console.log(fill)
        return (
            <g onMouseDown={this.handleMouseDown} onClick={this.handleClick} onDoubleClick={this.handleDoubleClick} element='Text' props={JSON.stringify(this.state)}>
                {/* <defs>
                    <filter x="-0.2" y="-0.2" width="1.4" height="1.4" id="solid">
                        <feFlood flood-color={fill} flood-opacity="1" result="offsetColor" />
                        <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur" />
                        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                    </filter>
                </defs> */}
                {box && <rect x={box.x} y={box.y} width={box.width} height={box.height} fill={fill} stroke="none" />}
                <text x={x} y={y} font-size={2 * (weight - 1) + 10} fill={stroke} ref={this.child}>{text}</text>
                {edit && <foreignObject x={x - 5} y={y - 21} width="100" height="30">

                    <input
                        autoFocus={true} onChange={this.handleText} onBlur={this.handleBlur}
                        style={{ width: `calc(100% - 10px)`, padding: '5px', border: 'None', color: { stroke }, fontSize: `${weight + 11}px`, fontFamily: 'Comic Sans MS', outline: 'gray dashed 2px', background: 'transparent', color: 'transparent' }}
                    />
                </foreignObject>}
            </g>
        )
    }
}

export default Text