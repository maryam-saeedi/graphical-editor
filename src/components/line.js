import React from 'react'
import PropTypes from 'prop-types';

class Line extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            points: this.props.points,
            path: this.props.path,
            arrow: this.props.arrow,
            stroke: this.props.stroke,
            weight: this.props.weight,
            dashed: this.props.dashed,
            corner: this.props.corner,
            shadow: this.props.shadow,
            strong: this.props.strong
        }
        this.handleClick = this.handleClick.bind(this)
        this.move = this.move.bind(this)
        this.handleCanvasUp = this.handleCanvasUp.bind(this)
        this.handleMove = this.handleMove.bind(this)
        this.handleMoving = this.handleMoving.bind(this)
        this.handleDoubleClick = this.handleDoubleClick.bind(this)
        this.clickInBoundry = this.clickInBoundry.bind(this)

        this.anchor = -1


        this.child = React.createRef()
    }

    componentDidMount() {
        const { points, path } = this.state
        if (path.length > 0)
            return
        path.push(["M"].concat(points[0]))
        path.push(["L"].concat(points[points.length - 1]))

        this.setState({ path })
    }
    componentDidUpdate() {
        this.box = this.child.current.getBBox()
    }
    updateStyle(prop, value) {
        return new Promise((resolve, reject) => {
            this.setState({ [prop]: value }, resolve(1))

        })
    }
    getStyle() {
        const { stroke, weight, dashed, corner, shadow, strong } = this.state
        return { stroke, weight, dashed, corner, shadow, strong }
    }
    getCorner() {
        return null
    }
    setCorner(corner) { }
    getLocation() {
        return { x: this.box.x, y: this.box.y, w: this.box.width, h: this.box.height }
    }
    setSize() {
        return new Promise((resolve, reject) => {
            reject(0)
        })
    }
    handleClick(e) {
        if (e.detail == 2)
            return
        this.anchor = -1
        this.setState({ layout: true })
        e.preventDefault()
        e.stopPropagation()
        this.setBoundry()
        this.props.clickInside(this.props.id)
    }
    handleAddAnchor(idx) {
        const self = this
        return function (e) {
            let { points, path } = self.state
            self.isAdding = true
            self.idx = idx + 1
            self.startMovingX = e.clientX
            self.startMovingY = e.clientY
            points.splice(idx + 1, 0, [(points[idx][0] + points[idx + 1][0]) / 2, (points[idx][1] + points[idx + 1][1]) / 2])
            path.splice(idx + 1, 0, ["L"].concat(points[idx + 1]))
            self.setState({ points, path })
            self.props.updateLayout(self.props.id, self.setBoundry())
            // self.props.changeShape()
        }
    }
    handleMove(idx, e) {
        // const self = this
        // return function (e) {
        this.isAdding = true
        this.idx = idx
        this.startMovingX = e.clientX
        this.startMovingY = e.clientY

        // }
    }
    handleAlign(direction, position) {
        this.anchor = -1
        switch (direction) {
            case "Up":
                // this.setState({ y: position }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                this.move(0, -(this.box.y - position))
                break
            case "Down":
                // this.setState({ y: position - this.state.h }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                this.move(0, position - this.box.y - this.box.height)
                break
            case "Right":
                this.setState({ x: position - this.state.w }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
            case "Left":
                this.setState({ x: position }, () => this.props.updateLayout(this.props.id, this.setBoundry()))
                break
        }
    }
    handleMoving(dw, dh, dx, dy) {
        let { points, path } = this.state
        points.splice(1, 1, [points[1][0] + dx, points[1][1] + dy])
        path.splice(1, 1, ["L"].concat(points[1]))
        return new Promise((resolve, reject) => {
            this.setState({ points, path },
                () => resolve(this.getLocation()))
        })
    }
    move(dx, dy) {
        let { points, path } = this.state
        const idx = this.anchor
        this.isMoving = true
        if (idx == -1) {    // move whole line
            points = points.map(p => [p[0] + dx, p[1] + dy])
            path = path.map(p => { p.splice(1, 2, p[1] + dx, p[2] + dy); if (p.length > 3) { p.splice(9, 2, p[9] + dx, p[10] + dy); p.splice(12, 2, p[12] + dx, p[13] + dy); } return p })
            this.setState({ path, points },
                () => this.props.updateLayout(this.props.id, this.setBoundry()))
            return
        }
        points.splice(idx, 1, [points[idx][0] + dx, points[idx][1] + dy])
        if (idx === points.length - 1 || idx === 0) {
            path.splice(idx, 1, [idx == 0 ? "M" : "L"].concat(points[idx]))
        } else {
            const piece = path.splice(idx, 2)
            if (!piece[0].includes("A") && !piece[1].includes("A")) {
                path.splice(idx, 0, ["L"].concat(points[idx]), piece[1])
            } else {
                if (piece[0][3] === "A") {
                    const ang = Math.atan2(points[idx][1] - points[idx - 1][1], points[idx][0] - points[idx - 1][0]);
                    path.splice(idx, 0,
                        ["L", points[idx - 1][0] + 10 * Math.cos(ang), points[idx - 1][1] + 10 * Math.sin(ang), "A", 10, 10, ang * 180 / Math.PI, 0, 1, points[idx][0] - 10 * Math.cos(ang), points[idx][1] - 10 * Math.sin(ang), "L", points[idx][0], points[idx][1]],
                        piece[1])
                }
                if (piece[1][3] === "A") {
                    const ang = Math.atan2(points[idx + 1][1] - points[idx][1], points[idx + 1][0] - points[idx][0]);
                    const interpolate = [(points[idx][0] + points[idx + 1][0]) / 2, (points[idx][1] + points[idx + 1][1]) / 2]
                    path.splice(idx, 0,
                        ["L"].concat(points[idx]),
                        ["L", points[idx][0] + 10 * Math.cos(ang), points[idx][1] + 10 * Math.sin(ang), "A", 10, 10, ang * 180 / Math.PI, 0, 1, points[idx + 1][0] - 10 * Math.cos(ang), points[idx + 1][1] - 10 * Math.sin(ang), "L", points[idx + 1][0], points[idx + 1][1]])
                }
            }
        }
        this.setState({ points, path })
        this.props.updateLayout(this.props.id, this.setBoundry())
    }
    handleCanvasUp() {
        this.isAdding = false
    }
    addBridge(idx) {
        const self = this
        return function () {
            let { points, path } = self.state
            const ang = Math.atan2(points[idx + 1][1] - points[idx][1], points[idx + 1][0] - points[idx][0]);
            points.splice(idx + 1, 0,
                [points[idx][0] + ((points[idx + 1][0] - points[idx][0]) / 2) - 20 * Math.cos(ang), points[idx][1] + ((points[idx + 1][1] - points[idx][1]) / 2) - 20 * Math.sin(ang)],
                [points[idx][0] + ((points[idx + 1][0] - points[idx][0]) / 2) + 20 * Math.cos(ang), points[idx][1] + ((points[idx + 1][1] - points[idx][1]) / 2) + 20 * Math.sin(ang)])
            path.splice(idx + 1, 1,
                ["L", points[idx + 1][0], points[idx + 1][1]],
                ["L", points[idx + 1][0] + 10 * Math.cos(ang), points[idx + 1][1] + 10 * Math.sin(ang), "A", 10, 10, ang * 180 / Math.PI, 0, 1, points[idx + 2][0] - 10 * Math.cos(ang), points[idx + 2][1] - 10 * Math.sin(ang), "L", points[idx + 2][0], points[idx + 2][1]],
                ["L", points[idx + 3][0], points[idx + 3][1]])
            self.setState({ points, path })
            self.props.updateLayout(self.props.id, self.setBoundry())
            self.props.changeShape()
        }
    }
    handleLogic(logic) {
        this.logic = logic
        console.log(this.logic)
    }
    handleDoubleClick(e) {
        console.log(('double cliked'), e.detail)
        this.props.addLogic(this.props.id, this.logic)
    }
    handleRightClick(e) {
        console.log('right clikc')
        e.preventDefault()
    }

    handleMoveLineAnchor(anchor) {
        const { id, handleBoundryClick } = this.props

        const self = this
        return function (e) {
            e.stopPropagation()
            self.isMoving = false
            self.anchor = anchor
            handleBoundryClick(id)
        }
    }
    clickInBoundry(e) {
        e.stopPropagation()
        !this.isMoving && this.props.deselect(this.props.id)
    }
    setBoundry() {
        const { points, path } = this.state
        let inter = []
        path.map((p, i) => {
            if (i > 0 && !p.includes("A")) {
                inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] })
            }
        })
        const b =
            <g onClick={e => e.stopPropagation()}>
                <path d={path.map(p => p.join(" ")).join(" ")} fill="transparent" stroke="transparent" strokeWidth="10px" onMouseDown={this.handleMoveLineAnchor(-1)} onClick={this.clickInBoundry} />
                {points.map((p, i) => <circle cx={p[0]} cy={p[1]} r="3" fill="gray" onMouseDown={this.handleMoveLineAnchor(i)} />)}
                {inter.flatMap((p, i) => [<circle cx={p.p[0]} cy={p.p[1]} r="3" fill="lightblue" stroke="gray" onMouseDown={this.handleAddAnchor(p.id)} />,
                <circle cx={p.p[0]} cy={p.p[1] - 10} r="3" fill="yellow" stroke="gray" onClick={this.addBridge(p.id)} />])}
            </g >

        return b
    }
    render() {
        const { points, layout, path } = this.state
        const { arrow, stroke, weight, dashed, corner, shadow, strong } = this.state

        let d = `M ${points[0][0]} ${points[0][1]} `
        for (let i = 1; i < points.length; i++) {
            d += `l ${points[i][0] - points[i - 1][0]} ${points[i][1] - points[i - 1][1]} `
        }

        const logic = this.logic
        let inter = []
        const angle = Math.atan2(points[points.length - 1][1] - points[points.length - 2][1], points[points.length - 1][0] - points[points.length - 2][0])
        return (
            <g
                element='Line' props={JSON.stringify(this.state)}
                onClick={this.handleClick}
                onDoubleClick={this.handleDoubleClick}
                // onContextMenu={this.handleRightClick}
                //  onMouseMove={this.handleCanvasMove} 
                onMouseDown={this.handleCanvasDown} onMouseUp={this.handleCanvasUp}
                ref={this.child}
            >
                <filter id="shadow" x="-50%" y="-50%" height="200%" width="200%">
                    <feOffset dx="0" dy="0" result="offsetblur" />
                    <feGaussianBlur in="SourceAlpha" stdDeviation={strong} />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="2" />
                    </feComponentTransfer>
                    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                </filter>
                <path
                    d={path.map((p, i) => {
                        let round = []
                        if (i > 0 && !p.includes("A")) {
                            inter.push({ id: i - 1, p: [(points[i - 1][0] + points[i][0]) / 2, (points[i - 1][1] + points[i][1]) / 2] });
                        }
                        let tmp = [...p]
                        if (corner == "round" && i > 0 && i < path.length - 1) {
                            const ang1 = Math.atan2(points[i][1] - points[i - 1][1], points[i][0] - points[i - 1][0])
                            const ang2 = Math.atan2(points[i + 1][1] - points[i][1], points[i + 1][0] - points[i][0])
                            round = ["Q", points[i][0], points[i][1], points[i][0] + 10 * Math.cos(ang2), points[i][1] + 10 * Math.sin(ang2)]
                            tmp.splice(p.length - 2, 2, p[p.length - 2] - 10 * Math.cos(ang1), p[p.length - 1] - 10 * Math.sin(ang1))
                        }
                        return tmp.concat(round).join(" ")
                    }).join(" ")}
                    fill="none" stroke="var(--logic, black)" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray={`${dashed + 0.1 * dashed * weight}, ${dashed + 0.1 * dashed * weight}`}
                    filter={shadow ? "url(#shadow)" : ""} />
                {arrow && <path d={`M${points[points.length - 1].join(" ")} L${points[points.length - 1][0] - 7 * Math.cos(angle - Math.PI / 8)} ${points[points.length - 1][1] - 7 * Math.sin(angle - Math.PI / 8)} L${points[points.length - 1][0] - 7 * Math.cos(angle + Math.PI / 8)} ${points[points.length - 1][1] - 7 * Math.sin(angle + Math.PI / 8)} Z`} fill={stroke} stroke={stroke} stroke-width={weight} />}
            </g>
        )
    }
}

export default Line

Line.defaultProps = {
    path: []
}
Line.PropTypes = {
    points: PropTypes.object.isRequired,
    path: PropTypes.object
}