export default class Utils {
    static throwMissing<T>(message: string): T {
        throw message
    }
}