class State {
    value = "";
    update = (e: string) => {
        this.value = e
    }
}

export const state = new State()