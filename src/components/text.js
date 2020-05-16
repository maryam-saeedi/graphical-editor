import React from "react"
import { transparent } from "material-ui/styles/colors";

class Text extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            x: this.props.x,
            y: this.props.y,
            edit: true,
            text: this.props.text
        }

        this.handleText = this.handleText.bind(this)
        this.handleBlur = this.handleBlur.bind(this)
        this.handleMouseDown = this.handleMouseDown.bind(this)
        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleMouseUp = this.handleMouseUp.bind(this)
        this.handleDoubleClick = this.handleDoubleClick.bind(this)
    }

    handleText(e) {
        this.setState({ text: e.target.value })
    }
    handleBlur() {
        this.setState({ edit: false })
    }
    handleMouseDown(e) {
        this.startMovingX = e.clientX
        this.startMovingY = e.clientY
        this.X = this.state.x
        this.Y = this.state.y
        this.isMoving = true
    }
    handleMouseMove(e) {
        let x = this.X, y = this.Y
        if (this.isMoving) {
            x = this.X + (e.clientX - this.startMovingX)
            y = this.Y + (e.clientY - this.startMovingY)
            this.setState({ x, y })
        }
    }
    handleMouseUp() {
        this.isMoving = false
    }

    handleLogic(logic) {
        this.logic = logic
        console.log(this.logic)
    }
    handleDoubleClick(e) {
        this.props.addLogic(this.props.id, this.logic)
    }

    render() {
        const { x, y, edit, text } = this.state
        const { weight, color } = this.props
        return (
            <g onDoubleClick={this.handleDoubleClick} element='Text' props={JSON.stringify(this.state)}>
                <text x={x} y={y} font-size={2 * (weight - 1) + 10} fill={color} onMouseDown={this.handleMouseDown} onMouseMove={this.handleMouseMove} onMouseUp={this.handleMouseUp}>{text}</text>
                {edit && <foreignObject x={x - 5} y={y - 21} width="100" height="30">

                    <input
                        autoFocus={true} onChange={this.handleText} onBlur={this.handleBlur}
                        style={{ width: `calc(100% - 10px)`, padding: '5px', border: 'None', color: { color }, fontSize: `${weight + 11}px`, fontFamily: 'Comic Sans MS', outline: 'gray dashed 2px', background: 'transparent', color: 'transparent' }}
                    />
                </foreignObject>}
            </g>
        )
    }
}

export default Text