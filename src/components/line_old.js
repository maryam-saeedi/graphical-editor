import React from 'react'
import { func } from 'prop-types';

class Line extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            points: this.props.points
        }
        this.handleClick = this.handleClick.bind(this)
        this.handleCanvasMove = this.handleCanvasMove.bind(this)
        this.handleCanvasUp = this.handleCanvasUp.bind(this)
    }

    handleClick(e) {
        this.setState({ layout: true })
    }
    handleAddAnchor(idx) {
        const self = this
        return function (e) {
            let { points } = self.state
            self.isAdding = true
            self.idx = idx + 1
            self.startMovingX = e.clientX
            self.startMovingY = e.clientY
            points.splice(idx + 1, 0, [(points[idx][0] + points[idx + 1][0]) / 2, (points[idx][1] + points[idx + 1][1]) / 2])
            self.setState({ points })
        }
    }
    handleMove(idx) {
        const self = this
        return function (e) {
            self.isAdding = true
            self.idx = idx
            self.startMovingX = e.clientX
            self.startMovingY = e.clientY
        }
    }
    handleCanvasMove(e) {
        let { points } = this.state
        if (this.isAdding) {
            points.splice(this.idx, 1, [e.clientX, e.clientY - 64])
        }
        this.setState({ points })
    }
    handleCanvasUp() {
        this.isAdding = false
    }
    render() {
        const { points, layout } = this.state
        const { arrow, stroke, weight, dashed } = this.props
        let interpolate = []
        for (var i = 0; i < points.length - 1; i++) {
            interpolate.push([(points[i][0] + points[i + 1][0]) / 2, (points[i][1] + points[i + 1][1]) / 2])
        }
        const angle = Math.atan2(points[points.length - 1][1] - points[points.length - 2][1], points[points.length - 1][0] - points[points.length - 2][0]);
        return (
            <g onClick={this.handleClick} onMouseMove={this.handleCanvasMove} onMouseDown={this.handleCanvasDown} onMouseUp={this.handleCanvasUp}>
                <polyline points={points.join(" ")} fill='none' stroke={stroke} stroke-width={weight} stroke-dasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`} />
                {arrow && <path d={`M${points[points.length - 1].join(" ")} L${points[points.length - 1][0] - 10 * Math.cos(angle - Math.PI / 6)} ${points[points.length - 1][1] - 10 * Math.sin(angle - Math.PI / 6)} L${points[points.length - 1][0] - 10 * Math.cos(angle + Math.PI / 6)} ${points[points.length - 1][1] - 10 * Math.sin(angle + Math.PI / 6)} Z`} fill={stroke} stroke={stroke} stroke-width={weight} />}
                {layout &&
                    [points.map((p, i) =>
                        <circle cx={p[0]} cy={p[1]} r="3" fill="gray" onMouseDown={this.handleMove(i)} />
                    ),
                    interpolate.map((p, i) =>
                        <circle cx={p[0]} cy={p[1]} r="3" fill="lightblue" stroke="gray" onMouseDown={this.handleAddAnchor(i)} />
                    )
                    ]
                }
            </g>
        )
    }
}

export default Line